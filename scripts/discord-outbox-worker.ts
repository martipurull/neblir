import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

// Next.js loads .env / .env.local automatically; this standalone script does not.
const envRoot = process.cwd();
loadEnv({ path: resolve(envRoot, ".env") });
loadEnv({ path: resolve(envRoot, ".env.local"), override: true });

import { prisma } from "../src/app/lib/prisma/client";

const DISCORD_API_BASE = "https://discord.com/api/v10";
const MAX_ATTEMPTS = 8;
const BASE_RETRY_MS = 10_000;
const POLL_MS = 1_000;
/** If a row stays PROCESSING (crash, SIGKILL, lost worker), reclaim after this long. */
const STALE_PROCESSING_MS = 5 * 60 * 1000;
const RECLAIM_INTERVAL_MS = 30_000;
const SHUTDOWN_SLEEP_STEP_MS = 500;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function backoffMs(attempt: number): number {
  const multiplier = Math.min(2 ** Math.max(0, attempt - 1), 64);
  return BASE_RETRY_MS * multiplier;
}

async function sleepWhile(ms: number, shouldContinue: () => boolean) {
  let remaining = ms;
  while (remaining > 0 && shouldContinue()) {
    const chunk = Math.min(SHUTDOWN_SLEEP_STEP_MS, remaining);
    await new Promise((r) => setTimeout(r, chunk));
    remaining -= chunk;
  }
}

async function reclaimStaleProcessing() {
  const cutoff = new Date(Date.now() - STALE_PROCESSING_MS);
  const stale = await prisma.discordOutbox.findMany({
    where: {
      status: "PROCESSING",
      updatedAt: { lt: cutoff },
    },
    select: { id: true },
  });
  if (stale.length === 0) return;

  await prisma.discordOutbox.updateMany({
    where: {
      id: { in: stale.map((s) => s.id) },
      status: "PROCESSING",
    },
    data: {
      status: "RETRY",
      nextAttemptAt: new Date(),
      lastError: "Reclaimed after PROCESSING timeout (worker restart or crash)",
    },
  });
}

/** Discord messages cannot use real text colours; emoji + **bold** stand in for red/green. */
function formatDieForDiscord(n: number): string {
  if (n >= 8 && n <= 10) return `🟢 ${n}`;
  return String(n);
}

/** Avoid breaking inline-code spans if the expression ever contains backticks. */
function escapeForDiscordInlineCode(s: string): string {
  return s.replace(/`/g, "'");
}

function getGeneralRollTag(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object") return "GENERAL_ROLL";
  const maybeNote = (metadata as { note?: unknown }).note;
  if (typeof maybeNote !== "string") return "GENERAL_ROLL";
  const trimmed = maybeNote.trim();
  return trimmed.length > 0 ? trimmed.toUpperCase() : "GENERAL_ROLL";
}

function formatRollMessage(event: {
  rollType: string;
  diceExpression: string | null;
  results: number[];
  total: number | null;
  metadata: unknown;
  rollerUser: { name: string };
  character: { generalInformation: { name: string; surname: string } } | null;
}) {
  const charName = event.character
    ? `${event.character.generalInformation.name} ${event.character.generalInformation.surname}`.trim()
    : "GM";
  const displayRollType =
    event.rollType === "GENERAL_ROLL"
      ? getGeneralRollTag(event.metadata)
      : event.rollType;
  const label = escapeForDiscordInlineCode(event.diceExpression ?? "roll");
  const summary = event.results.map(formatDieForDiscord).join(", ");
  const totalResult = event.total ? `  **→** **Total: ${event.total}**` : "";
  return (
    `🎲 **${event.rollerUser.name}** as **${charName}** ► **\n${displayRollType}**\n` +
    `**Rolled** \`${label}\` **→** \`[${summary}]\`${totalResult}`
  );
}

async function postToDiscord(channelId: string, content: string) {
  const botToken = requireEnv("DISCORD_BOT_TOKEN");
  const response = await fetch(
    `${DISCORD_API_BASE}/channels/${channelId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    }
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Discord post failed (${response.status}): ${text}`);
  }
}

async function processOne(outboxId: string) {
  const row = await prisma.discordOutbox.findUnique({
    where: { id: outboxId },
    include: {
      integration: true,
      rollEvent: {
        include: {
          rollerUser: { select: { name: true } },
          character: {
            select: {
              generalInformation: { select: { name: true, surname: true } },
            },
          },
        },
      },
    },
  });
  if (!row) return;

  try {
    const content = formatRollMessage({
      rollType: row.rollEvent.rollType,
      diceExpression: row.rollEvent.diceExpression,
      results: row.rollEvent.results,
      total: row.rollEvent.total,
      metadata: row.rollEvent.metadata,
      rollerUser: row.rollEvent.rollerUser,
      character: row.rollEvent.character,
    });

    await postToDiscord(row.integration.channelId, content);

    await prisma.discordOutbox.update({
      where: { id: row.id },
      data: { status: "SENT", sentAt: new Date(), lastError: null },
    });

    await prisma.discordIntegration.update({
      where: { id: row.integrationId },
      data: { status: "ACTIVE", lastError: null },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const nextAttemptCount = row.attemptCount + 1;
    const dead = nextAttemptCount >= MAX_ATTEMPTS;
    await prisma.discordOutbox.update({
      where: { id: row.id },
      data: {
        status: dead ? "DEAD_LETTER" : "RETRY",
        attemptCount: nextAttemptCount,
        lastError: message,
        nextAttemptAt: new Date(Date.now() + backoffMs(nextAttemptCount)),
      },
    });

    if (dead) {
      await prisma.discordIntegration.update({
        where: { id: row.integrationId },
        data: { status: "DEGRADED", lastError: message },
      });
    }
  }
}

async function claimBatch(limit = 20) {
  const candidates = await prisma.discordOutbox.findMany({
    where: {
      status: { in: ["PENDING", "RETRY"] },
      nextAttemptAt: { lte: new Date() },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true },
  });

  const claimed: string[] = [];
  for (const candidate of candidates) {
    const result = await prisma.discordOutbox.updateMany({
      where: {
        id: candidate.id,
        status: { in: ["PENDING", "RETRY"] },
      },
      data: { status: "PROCESSING" },
    });
    if (result.count > 0) claimed.push(candidate.id);
  }
  return claimed;
}

async function run() {
  requireEnv("DISCORD_BOT_TOKEN");

  let keepRunning = true;
  let lastReclaimAt = 0;

  const shutdown = () => {
    keepRunning = false;
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  while (keepRunning) {
    const now = Date.now();
    if (now - lastReclaimAt >= RECLAIM_INTERVAL_MS) {
      await reclaimStaleProcessing();
      lastReclaimAt = now;
    }

    const ids = await claimBatch();
    for (const id of ids) {
      await processOne(id);
    }

    if (!keepRunning) break;
    await sleepWhile(POLL_MS, () => keepRunning);
  }
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
