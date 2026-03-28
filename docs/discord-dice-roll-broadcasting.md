# Discord Dice Roll Broadcasting

## Runbook

1. Set `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_BOT_TOKEN`, and `DISCORD_REDIRECT_URI` in **`.env.local` (or the env used by `next dev`)**, not only in the worker process — listing channels uses the bot token from the Next.js server.
2. Push Prisma schema updates:
   - `npm run prisma:generate`
   - `npm run prisma:push`
3. Start app: `npm run dev`.
4. Start Discord worker in another terminal: `npm run worker:discord`.

## Manual E2E Checklist

- [ ] As GM, open game master page and click **Connect Discord**.
- [ ] Complete Discord OAuth install and return to GM page with guild selected.
- [ ] Select a **text** or **voice** channel (voice uses [Text in Voice](https://discord.com/blog/text-in-voice-chat-channel-announcement-tiv) on that channel’s ID) and click **Save channel**.
- [ ] Click **Send test message** and verify the message appears in the configured channel.
- [ ] Roll from character page:
  - [ ] Generic dice roll modal
  - [ ] Attack roll
  - [ ] Attack damage roll
  - [ ] Melee/range defence roll
  - [ ] GRID defence roll
  - [ ] Item damage roll
  - [ ] Initiative roll (player and GM NPC)
- [ ] Verify each roll appears in Discord with expected roll type and values.
- [ ] Disconnect integration and verify no new outbox deliveries happen.

## Failure Handling Notes

- Outbox retries automatically with exponential backoff.
- Jobs move to `DEAD_LETTER` after max attempts.
- Integration is marked `DEGRADED` when repeated delivery fails.
- The worker handles **SIGTERM** / **SIGINT** (e.g. systemd or Docker stop): it finishes the current claimed batch, skips the long idle sleep, and exits with code 0.
- Rows stuck in **PROCESSING** for longer than **5 minutes** (crash, `SIGKILL`, or killed mid-flight) are reset to **RETRY** on a periodic reclaim (about every 30s while the worker runs). `attemptCount` is not incremented for reclaim.
