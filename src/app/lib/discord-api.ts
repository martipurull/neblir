const DISCORD_API_BASE = "https://discord.com/api/v10";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

/** Bot-only calls (channel list, guild name) — do not require OAuth client secret on the server. */
export function getDiscordBotToken(): string {
  return requireEnv("DISCORD_BOT_TOKEN");
}

export function getDiscordOAuthConfig() {
  return {
    clientId: requireEnv("DISCORD_CLIENT_ID"),
    clientSecret: requireEnv("DISCORD_CLIENT_SECRET"),
    redirectUri: requireEnv("DISCORD_REDIRECT_URI"),
    botToken: getDiscordBotToken(),
  };
}

/** Discord API ChannelType — we only surface types you can target for roll messages. */
const ROLL_TARGET_CHANNEL_TYPES = new Set([
  0, // GUILD_TEXT
  2, // GUILD_VOICE (Text in Voice — same channel id as the voice channel)
  5, // GUILD_NEWS (announcement)
  13, // GUILD_STAGE_VOICE (stage text chat)
]);

export type DiscordGuildChannelRow = {
  id: string;
  name: string;
  /** Discord API `type` (e.g. 0 text, 2 voice). */
  channelType: number;
};

export type DiscordGuildChannelsResult = {
  guildName: string;
  channels: DiscordGuildChannelRow[];
};

export async function fetchDiscordGuildChannelsWithMeta(
  guildId: string
): Promise<DiscordGuildChannelsResult> {
  const botToken = getDiscordBotToken();
  const headers = {
    Authorization: `Bot ${botToken}`,
    "Content-Type": "application/json",
  };

  const guildRes = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}`, {
    headers,
    cache: "no-store",
  });
  let guildName = "Discord server";
  if (guildRes.ok) {
    const guild = (await guildRes.json()) as { name?: string };
    if (guild.name) guildName = guild.name;
  } else if (guildRes.status === 401) {
    const text = await guildRes.text();
    throw new Error(
      `Discord rejected the bot token (401). Set DISCORD_BOT_TOKEN in the same env as the Next.js server (e.g. .env.local) and ensure it matches the application’s bot user. ${text.slice(0, 200)}`
    );
  }

  const response = await fetch(
    `${DISCORD_API_BASE}/guilds/${guildId}/channels`,
    {
      headers,
      cache: "no-store",
    }
  );
  if (!response.ok) {
    const text = await response.text();
    if (response.status === 401) {
      throw new Error(
        `Discord rejected the bot token (401) when listing channels. Confirm DISCORD_BOT_TOKEN on the Next.js server is the Bot token from the Developer Portal (not the OAuth secret). ${text.slice(0, 200)}`
      );
    }
    throw new Error(
      `Discord channels request failed (${response.status}): ${text.slice(0, 500)}`
    );
  }
  const channels = (await response.json()) as Array<{
    id: string;
    name: string;
    type: number;
  }>;
  const rollTargets = channels
    .filter((channel) => ROLL_TARGET_CHANNEL_TYPES.has(channel.type))
    .map((channel) => ({
      id: channel.id,
      name: channel.name,
      channelType: channel.type,
    }));
  const typeRank = (t: number) =>
    t === 0 || t === 5 ? 0 : t === 2 ? 1 : t === 13 ? 2 : 9;
  rollTargets.sort((a, b) => {
    const byType = typeRank(a.channelType) - typeRank(b.channelType);
    if (byType !== 0) return byType;
    return a.name.localeCompare(b.name);
  });
  return { guildName, channels: rollTargets };
}
