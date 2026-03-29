import { z } from "zod";

export const discordIntegrationStatusSchema = z.enum([
  "ACTIVE",
  "DISABLED",
  "DEGRADED",
]);

export const discordIntegrationSchema = z.object({
  gameId: z.string(),
  guildId: z.string(),
  channelId: z.string(),
  status: discordIntegrationStatusSchema,
  lastError: z.string().nullable().optional(),
});

export const connectDiscordStartResponseSchema = z.object({
  url: z.string().url(),
});

export const discordChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  channelType: z.number(),
});

export const discordGuildChannelsResponseSchema = z.object({
  guildId: z.string(),
  guildName: z.string(),
  channels: z.array(discordChannelSchema),
});

export const saveDiscordIntegrationBodySchema = z
  .object({
    guildId: z.string(),
    channelId: z.string(),
  })
  .strict();

export type DiscordIntegration = z.infer<typeof discordIntegrationSchema>;
export type DiscordChannel = z.infer<typeof discordChannelSchema>;
