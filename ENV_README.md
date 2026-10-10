# Environment Variables Setup Guide

This document describes how to set up all the required environment variables for the Neblir application.

## Required Environment Variables

### Database

#### `MONGODB_URI`

- **Description**: MongoDB connection string for the shared development database
- **Format**: `mongodb://[username:password@]host[:port][/database]`
- **How to get**: Use the shared dev MongoDB connection string for the project

---

### Google OAuth Authentication

#### `AUTH_GOOGLE_ID`

- **Description**: Google OAuth Client ID for NextAuth authentication
- **How to get**:
  1. Go to [Google Cloud Console](https://console.cloud.google.com/)
  2. Create a new project or select an existing one
  3. Navigate to **APIs & Services** → **Credentials**
  4. Click **Create Credentials** → **OAuth client ID**
  5. Configure the OAuth consent screen if prompted (for first-time setup)
  6. Select **Web application** as the application type
  7. Add authorized redirect URIs:
     - For local development: `http://localhost:3000/api/auth/callback/google`
     - For production: `https://your-domain.com/api/auth/callback/google`
  8. Copy the **Client ID** value

#### `AUTH_GOOGLE_SECRET`

- **Description**: Google OAuth Client Secret for NextAuth authentication
- **How to get**:
  1. After creating the OAuth client ID (see above), the **Client Secret** will be displayed
  2. Copy the **Client Secret** value
  3. ⚠️ **Important**: Store this securely - it won't be shown again after you leave the page

---

### Cloudflare R2 Storage

#### `R2_NEBLIR_ACCOUNT_ID`

- **Description**: Cloudflare Account ID for R2 storage
- **How to get**:
  1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
  2. Select your account
  3. The Account ID can be found in the right sidebar of the dashboard
  4. Alternatively, navigate to **R2** → any bucket → the Account ID is displayed

#### `R2_NEBLIR_BUCKET_NAME`

- **Description**: R2 bucket name for game-scoped and player-scoped files (character portraits, custom items/enemies/vehicles, unique items/vehicles, games, files, lore, recaps). Official catalogue art is **not** stored here.
- **Value**: `neblir` in development/preview; `neblir-prod` in production.

#### `R2_NEBLIR_ACCOUNT_ACCESS_KEY`

- **Description**: R2 API token access key ID
- **How to get**:
  1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
  2. Navigate to **My Profile** → **API Tokens**
  3. Click **Create Token**
  4. Use the **Edit Cloudflare Workers** template, or create a custom token with:
     - **Permissions**: `Account` → `Cloudflare R2` → `Edit`
     - **Account Resources**: Include your account
  5. Alternatively, for R2-specific access:
     - Go to **R2** → **Manage R2 API Tokens**
     - Click **Create API Token**
     - Give it a name (e.g., "neblir-dev")
     - Select permissions: **Object Read & Write** or as needed
     - Copy the **Access Key ID** value

#### `R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY`

- **Description**: R2 API token secret access key
- **How to get**:
  1. Follow the steps above to create an R2 API token
  2. After creating the token, the **Secret Access Key** will be displayed **only once**
  3. ⚠️ **Important**: Copy and store this immediately - it cannot be retrieved later
  4. If you lose it, you'll need to create a new API token

#### `R2_NEBLIR_CATALOGUE_BUCKET_NAME`

- **Description**: Shared R2 bucket for **official** catalogue images (items, vehicles, maps, enemies, currencies). Every environment reads the same objects.
- **Value**: `neblir-catalogue`
- **Note**: Do not copy official objects into the env buckets. JSON catalogue rows still store `imageKey` only.

#### `R2_NEBLIR_CATALOGUE_BUCKET_ACCESS_KEY`

- **Description**: R2 API token access key ID scoped to the catalogue bucket (preferred over reusing the env-bucket token)
- **How to get**: Same as `R2_NEBLIR_ACCOUNT_ACCESS_KEY`, but create a token limited to `neblir-catalogue` with Object Read & Write
- **Note**: Reuses `R2_NEBLIR_ACCOUNT_ID` for the API endpoint. Super-admin uploads and deletes of official art use this token from any environment that has it.

#### `R2_NEBLIR_CATALOGUE_BUCKET_SECRET_ACCESS_KEY`

- **Description**: Secret for the catalogue-bucket API token
- **How to get**: Shown once when you create the catalogue token; store it immediately

---

### Discord Dice Roll Broadcasting

#### `DISCORD_CLIENT_ID`

- **Description**: Discord application client ID used to start bot install OAuth flow
- **How to get**:
  1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
  2. Create/select your Neblir Discord application
  3. Copy **Application ID** from the General Information page

#### `DISCORD_CLIENT_SECRET`

- **Description**: Discord OAuth client secret for the same application
- **How to get**:
  1. Open your Discord application in Developer Portal
  2. Go to **OAuth2** section
  3. Click **Reset Secret** if needed and copy the secret
  4. Store securely

#### `DISCORD_BOT_TOKEN`

- **Description**: Bot token used by channel listing and outbox worker delivery
- **How to get**:
  1. In Developer Portal, open your application
  2. Go to **Bot**
  3. Click **Reset Token** if needed and copy token
  4. Keep private and rotate if leaked

#### `DISCORD_REDIRECT_URI`

- **Description**: OAuth callback URL for Discord bot install flow
- **Format**:
  - Local: `http://localhost:3000/api/discord/callback`
  - Production: `https://neblir.com/api/discord/callback`
- **How to get**:
  1. In Developer Portal, open **OAuth2**
  2. Add the callback URL under redirect URIs
  3. Use the exact same value in `.env`

---

## Optional Environment Variables

### `LOG_LEVEL`

- **Description**: Logging level for the application logger
- **Default**: `debug` in development, `info` in production
- **Values**: `debug`, `info`, `warn`, `error`

### `NODE_ENV`

- **Description**: Node.js environment mode
- **Default**: Set automatically by Next.js
- **Values**: `development`, `production`, `test`

---

### Official Data Seed (Optional but recommended)

These variables are used by `npm run seed:official-data`. The command imports canonical game content into the database pointed by `MONGODB_URI`.

#### `OFFICIAL_DATA_ITEMS_FILE`

- **Description**: CSV or JSON file path for global items import (`upsertItemsFromFile.ts`)
- **Example**: `~/Documents/Neblir/Game/data/Item_Upload.csv` or `~/Documents/Neblir/Game/data/items.json`

#### `OFFICIAL_DATA_ENEMIES_FILE`

- **Description**: CSV or JSON file path for official enemies import (`upsertEnemiesFromFile.ts`)
- **Example**: `~/Documents/Neblir/Game/data/Enemy_Upload.csv` or `~/Documents/Neblir/Game/data/enemies.json`

#### `OFFICIAL_DATA_FEATURES_FILE`

- **Description**: CSV or JSON file path for features import (`upsertPathsAndFeaturesFromFile.ts`)
- **Example**: `~/Documents/Neblir/Game/data/Feature_Upload.csv` or `~/Documents/Neblir/Game/data/features.json`

#### `OFFICIAL_DATA_PATHS_FILE`

- **Description**: CSV or JSON file path for paths import (`upsertPathsAndFeaturesFromFile.ts`)
- **Example**: `~/Documents/Neblir/Game/data/Path_Upload.csv` or `~/Documents/Neblir/Game/data/paths.json`

#### `OFFICIAL_DATA_MAPS_FILE` (optional)

- **Description**: CSV or JSON file path for maps import (`upsertMapsFromFile.ts`)
- **Example**: `~/Documents/Neblir/Game/data/Map_Upload.csv` or `~/Documents/Neblir/Game/data/maps.json`

Legacy `*_CSV` env names are still accepted by the orchestrator for backward compatibility.

#### `OFFICIAL_DATA_REFERENCE_FILE` (optional)

- **Description**: JSON file for global/game reference import (`upsertReferenceEntriesFromFile.ts`). Root may be an array or `{ "reference": [ ... ] }` (catalogue export shape). When set, `data:seed:official` uses this instead of the HTML dirs below.
- **Example**: `prisma/data/Reference_Upload.json`

#### `OFFICIAL_DATA_REFERENCE_MECHANICS_DIR` (optional)

- **Description**: Directory or HTML file for `MECHANICS` reference import (legacy HTML workflow; skipped when `OFFICIAL_DATA_REFERENCE_FILE` is set)

#### `OFFICIAL_DATA_REFERENCE_WORLD_DIR` (optional)

- **Description**: Directory or HTML file for `WORLD` reference import (legacy HTML workflow; skipped when `OFFICIAL_DATA_REFERENCE_FILE` is set)

---

## Setup Instructions

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Fill in all the required environment variables in your `.env` file

3. Restart your development server for changes to take effect

---

## Security Notes

- ⚠️ **Never commit `.env` files to version control** - they are already in `.gitignore`
- Store sensitive credentials securely
- Use different credentials for development and production environments
- Rotate API keys and secrets regularly
- If credentials are exposed, rotate them immediately

---

### Catalogue environment and Catalogue sync

Each running process is configured as **exactly one** Catalogue environment. Do **not** infer this from `VERCEL_ENV` or `NODE_ENV`. Vercel preview deployments are the development Catalogue environment.

#### `CATALOGUE_ENVIRONMENT`

- **Description**: Which live Official catalogue this process is. Required for Catalogue sync.
- **Values**: `development`, `production`, or `local`
- **Preview**: `development`
- **Local**: use `local` for a distinct local database. Local may be a Catalogue sync destination only; other environments cannot pull it as a source.

#### `CATALOGUE_SYNC_PULL_SECRET`

- **Description**: Server-only shared secret for the Catalogue sync **source snapshot** door (`GET /api/catalogue-sync/snapshot`). Dest pulls with this secret; the browser must never receive it. Cookie super-admin sessions are not this door.
- **How to set**: Generate a long random string and set the **same** value on every environment that participates in Catalogue sync (development, production, and local dest).
- ⚠️ **Important**: Treat this like a password. Rotate if leaked.

#### `CATALOGUE_SYNC_DEVELOPMENT_URL`

- **Description**: Public base URL of the development Catalogue environment (no trailing slash). Dest uses this to pull the Official snapshot when source is development. Also used to link Super Admins to that environment’s hub.
- **Example**: `https://neblir-git-main-….vercel.app` or the stable development host

#### `CATALOGUE_SYNC_PRODUCTION_URL`

- **Description**: Public base URL of the production Catalogue environment (no trailing slash). Dest uses this to pull when source is production, and to link to production super-admin.
- **Example**: `https://neblir.com`

Local has no pullable source URL. Set **both** development and production public URLs on every participating process: dest uses the source URL to pull, and off-dest Catalogue sync uses the destination URL to link Super Admins to dest’s hub with the pairing.
