# Discord: one application per environment class

Roll posts use a Discord application's bot token, and that token can post in every guild the bot has joined. Local and development Preview share one dev Discord application. Vercel Production and the production outbox worker share a separate production application. Each process holds one matched set of the same env names (`DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_BOT_TOKEN`, `DISCORD_REDIRECT_URI`) for the application that belongs with its database. A leaked preview env or laptop must not be able to post as the bot a live table already trusts.

## Considered Options

- **One application, many redirect URIs:** Discord allows localhost and `https://neblir.com/api/discord/callback` on a single application. OAuth can return to the right host, and the production bot token still sits on every laptop and preview. A leak posts in live campaign channels as the production bot.
- **A third application for local only:** local and development Preview are both non-production. They share the dev application.
- **Code that selects credentials by environment name:** a process already has one database and one env. Branching inside the app would place both tokens in one process.

## Consequences

- Dev redirect allowlist: `http://localhost:3000/api/discord/callback` and the stable development host's `/api/discord/callback`. Production allowlist: `https://neblir.com/api/discord/callback`.
- Connect Discord finishes on the redirect host. A one-off preview URL returns to the stable development host, which uses the development database. Games store guild id and channel id only, so this is configuration, not an app change.
- The production worker is the only worker with the production token, and its `MONGODB_URI` is the production database. Local `worker:discord` uses the dev token and the local database. No worker runs against the development database. Preview can install the dev bot and list channels, and does not broadcast rolls.
- `DISCORD_CLIENT_ID` and `DISCORD_BOT_TOKEN` belong to the same application. The client id chooses which bot the install link invites. The token lists channels and posts.
- Games already connected in local or development invited the production bot. Connect Discord again on those games so the dev bot joins that server.
