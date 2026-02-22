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

- **Description**: R2 bucket name for storing files
- **Value**: `neblir`
- **Note**: This is already set for this project

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
