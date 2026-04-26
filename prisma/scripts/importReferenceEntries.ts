/**
 * Import Google Docs HTML exports into ReferenceEntry documents.
 *
 * Usage:
 *   npx tsx prisma/scripts/importReferenceEntries.ts <category> <html-file-or-dir> [options]
 *
 * Examples:
 *   npx tsx prisma/scripts/importReferenceEntries.ts MECHANICS ./exports/mechanics
 *   npx tsx prisma/scripts/importReferenceEntries.ts WORLD ./exports/world/intro.html
 *   npx tsx prisma/scripts/importReferenceEntries.ts WORLD ./exports/world --tag public
 *   npx tsx prisma/scripts/importReferenceEntries.ts CAMPAIGN_LORE ./exports/game-lore --game-id 66f... --access GAME_MASTER
 *
 * Options:
 *   --game-id <id>       Required for CAMPAIGN_LORE.
 *   --access <access>    PLAYER or GAME_MASTER. Defaults to PLAYER.
 *   --tag <tag>          Repeatable. Adds tags to every imported entry.
 *   --store-html         Also store the original HTML in contentHtml.
 *   --dry-run            Parse and report what would be imported without writing.
 *
 * Env:
 *   MONGODB_URI is required by Prisma.
 */

import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import type { JSONContent } from "@tiptap/core";
import { generateJSON } from "@tiptap/html/server";
import StarterKit from "@tiptap/starter-kit";

const prisma = new PrismaClient();

const VALID_CATEGORIES = ["MECHANICS", "WORLD", "CAMPAIGN_LORE"] as const;
const VALID_ACCESS = ["PLAYER", "GAME_MASTER"] as const;

type ReferenceCategory = (typeof VALID_CATEGORIES)[number];
type ReferenceAccess = (typeof VALID_ACCESS)[number];

interface ImportOptions {
  category: ReferenceCategory;
  inputPath: string;
  gameId?: string;
  access: ReferenceAccess;
  tags: string[];
  storeHtml: boolean;
  dryRun: boolean;
}

function usage(): never {
  console.error(
    [
      "Usage: npx tsx prisma/scripts/importReferenceEntries.ts <category> <html-file-or-dir> [options]",
      "",
      "Categories: MECHANICS, WORLD, CAMPAIGN_LORE",
      "Options:",
      "  --game-id <id>       Required for CAMPAIGN_LORE",
      "  --access <access>    PLAYER or GAME_MASTER. Defaults to PLAYER",
      "  --tag <tag>          Repeatable",
      "  --store-html         Store original HTML in contentHtml",
      "  --dry-run            Do not write to MongoDB",
    ].join("\n")
  );
  process.exit(1);
}

function assertCategory(value: string | undefined): ReferenceCategory {
  if (!value || !VALID_CATEGORIES.includes(value as ReferenceCategory)) {
    usage();
  }
  return value as ReferenceCategory;
}

function assertAccess(value: string): ReferenceAccess {
  if (!VALID_ACCESS.includes(value as ReferenceAccess)) {
    throw new Error(
      `Invalid access "${value}". Expected PLAYER or GAME_MASTER.`
    );
  }
  return value as ReferenceAccess;
}

function normalizeArgv(argv: string[]): string[] {
  return argv[0] === "--" ? argv.slice(1) : argv;
}

function resolveInputPath(inputPath: string): string {
  if (inputPath === "~") {
    return process.env.HOME ?? inputPath;
  }
  if (inputPath.startsWith("~/")) {
    return path.join(process.env.HOME ?? "~", inputPath.slice(2));
  }
  return path.resolve(inputPath);
}

function parseArgs(argv: string[]): ImportOptions {
  const args = normalizeArgv(argv);
  const category = assertCategory(args[0]);
  const inputPath = args[1];
  if (!inputPath) usage();

  const options: ImportOptions = {
    category,
    inputPath: resolveInputPath(inputPath),
    access: "PLAYER",
    tags: [],
    storeHtml: false,
    dryRun: false,
  };

  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--game-id": {
        const value = args[++i];
        if (!value) throw new Error("--game-id requires a value.");
        options.gameId = value;
        break;
      }
      case "--access": {
        const value = args[++i];
        if (!value) throw new Error("--access requires a value.");
        options.access = assertAccess(value);
        break;
      }
      case "--tag": {
        const value = args[++i];
        if (!value) throw new Error("--tag requires a value.");
        options.tags.push(value);
        break;
      }
      case "--store-html":
        options.storeHtml = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      default:
        throw new Error(`Unknown option "${arg}".`);
    }
  }

  if (category === "CAMPAIGN_LORE" && !options.gameId) {
    throw new Error("CAMPAIGN_LORE imports require --game-id.");
  }

  return options;
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function filenameToTitle(filename: string): string {
  const name = path.basename(filename, path.extname(filename));
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function firstTextInNode(node: JSONContent): string | null {
  if (node.type === "text" && typeof node.text === "string") {
    return node.text;
  }

  const childText = node.content
    ?.map(firstTextInNode)
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ");

  return childText?.trim() || null;
}

function firstHeadingTitle(doc: JSONContent): string | null {
  const stack = [...(doc.content ?? [])];
  while (stack.length > 0) {
    const node = stack.shift();
    if (!node) continue;
    if (node.type === "heading") {
      return firstTextInNode(node);
    }
    stack.unshift(...(node.content ?? []));
  }
  return null;
}

function htmlTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) return null;
  return match[1]
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

interface HtmlInput {
  sourceFile: string;
  displayName: string;
}

async function htmlInputsIn(inputPath: string): Promise<HtmlInput[]> {
  const stat = await fs.stat(inputPath);

  if (stat.isFile()) {
    if (!/\.html?$/i.test(inputPath)) {
      throw new Error(`Input file is not an HTML file: ${inputPath}`);
    }
    return [
      {
        sourceFile: inputPath,
        displayName: path.basename(inputPath),
      },
    ];
  }

  if (!stat.isDirectory()) {
    throw new Error(
      `Input path is neither a file nor a directory: ${inputPath}`
    );
  }

  const entries = await fs.readdir(inputPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /\.html?$/i.test(entry.name))
    .map((entry) => ({
      sourceFile: path.join(inputPath, entry.name),
      displayName: entry.name,
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

async function importFile(
  options: ImportOptions,
  input: HtmlInput,
  index: number
): Promise<"created" | "updated" | "skipped"> {
  const { sourceFile, displayName } = input;
  const html = await fs.readFile(sourceFile, "utf8");
  const contentJson = generateJSON(html, [StarterKit]) as JSONContent;
  const title =
    firstHeadingTitle(contentJson) ??
    htmlTitle(html) ??
    filenameToTitle(displayName);
  const slug = slugify(
    path.basename(displayName, path.extname(displayName)) || title
  );

  if (!slug) {
    throw new Error(`Could not derive a slug for ${sourceFile}.`);
  }

  const data = {
    category: options.category,
    slug,
    title,
    access: options.access,
    tags: [...new Set(options.tags.map((tag) => tag.trim()).filter(Boolean))],
    sortOrder: index,
    contentJson: JSON.parse(JSON.stringify(contentJson)),
    contentHtml: options.storeHtml ? html : null,
    sourceFile: path.relative(process.cwd(), sourceFile),
    gameId: options.gameId ?? null,
  };

  if (options.dryRun) {
    console.log(
      `[dry-run] ${options.category}/${slug}: "${title}" from ${displayName}`
    );
    return "skipped";
  }

  const existing = await prisma.referenceEntry.findFirst({
    where: {
      category: options.category,
      slug,
      gameId: options.gameId ?? null,
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.referenceEntry.update({
      where: { id: existing.id },
      data,
    });
    console.log(`Updated ${options.category}/${slug}`);
    return "updated";
  }

  await prisma.referenceEntry.create({ data });
  console.log(`Created ${options.category}/${slug}`);
  return "created";
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const files = await htmlInputsIn(options.inputPath);

  if (files.length === 0) {
    console.log(`No HTML files found in ${options.inputPath}.`);
    return;
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < files.length; i++) {
    const result = await importFile(options, files[i], i);
    if (result === "created") created++;
    if (result === "updated") updated++;
    if (result === "skipped") skipped++;
  }

  console.log(
    `Done. Created: ${created}, updated: ${updated}, skipped: ${skipped}, files: ${files.length}.`
  );
}

function formatUnknownError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }
  return String(error);
}

main()
  .catch((error) => {
    console.error(formatUnknownError(error));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
