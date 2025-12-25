# Fetch Google Docs Script

This script fetches Google Docs documents using the Google Docs API with an access token from OAuth 2.0 Playground and saves their JSON representations to a single file.

## Setup

### 1. Get Access Token from OAuth 2.0 Playground

This is the easiest way to get an access token without setting up OAuth credentials:

1. Go to [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. In the left panel, scroll down and find **"Google Docs API v1"**
3. Check the box for: `https://www.googleapis.com/auth/documents.readonly`
4. Click **"Authorize APIs"** button at the bottom
5. Sign in with your Google account (the one that has access to the documents)
6. Grant the requested permissions
7. Click **"Exchange authorization code for tokens"** button
8. Copy the **"Access token"** value (it's a long string)

**Note**: Access tokens typically expire after 1 hour. If you get authentication errors, get a new token from the playground.

### 2. Input File

The script reads from `/Users/martipurull/Desktop/repos/neblir/items.json` which should have this format:

```json
{
  "files": [
    {
      "name": "Document 1",
      "id": "1a2b3c4d5e6f7g8h9i0j"
    },
    {
      "name": "Document 2",
      "id": "2b3c4d5e6f7g8h9i0j1k"
    }
  ]
}
```

The `id` is the document ID from the Google Docs URL:
- URL format: `https://docs.google.com/document/d/DOCUMENT_ID/edit`
- Extract the `DOCUMENT_ID` part

## Usage

### Option 1: Using Environment Variable

```bash
export GOOGLE_ACCESS_TOKEN="your-access-token-here"
npx tsx prisma/scripts/fetchGoogleDocs.ts
```

### Option 2: Using Command-Line Argument

```bash
npx tsx prisma/scripts/fetchGoogleDocs.ts [output-file] [access-token]
```

Examples:
```bash
# Default output file (./all-google-docs.json) with token as argument
npx tsx prisma/scripts/fetchGoogleDocs.ts ./all-google-docs.json "ya29.a0AfH6SMC..."

# Custom output file with token as argument
npx tsx prisma/scripts/fetchGoogleDocs.ts ./my-output.json "ya29.a0AfH6SMC..."

# Using environment variable
GOOGLE_ACCESS_TOKEN="ya29.a0AfH6SMC..." npx tsx prisma/scripts/fetchGoogleDocs.ts ./output.json
```

## Output

The script creates a single JSON file containing all documents' JSON content. The file structure:

```json
{
  "fetchedAt": "2024-01-01T12:00:00.000Z",
  "totalDocuments": 10,
  "successful": 9,
  "failed": 1,
  "results": [
    {
      "name": "Document 1",
      "id": "1a2b3c4d5e6f7g8h9i0j",
      "document": {
        /* Full Google Docs API response with all document content */
        "documentId": "...",
        "title": "...",
        "body": { /* document structure */ },
        ...
      },
      "fetchedAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "errors": [
    {
      "name": "Document 2",
      "id": "2b3c4d5e6f7g8h9i0j1k",
      "error": "Error message"
    }
  ]
}
```

Each `result.document` contains the complete JSON representation of the Google Doc as returned by the Google Docs API, including:
- Document structure (body, paragraphs, text runs, etc.)
- Formatting information
- All content and metadata

## Next Steps

After fetching the documents, you can:
1. Extract specific information from the `document` field in each result
2. Process the data and convert to CSV format
3. Parse the document structure to extract text, tables, or other elements

## Troubleshooting

**Token expired error:**
- Access tokens from OAuth Playground expire after about 1 hour
- Simply get a new token from the playground and run the script again

**401 / Unauthorized errors:**
- Make sure you're using a fresh token from OAuth Playground
- Verify you signed in with the correct Google account that has access to the documents
- Check that you selected the correct scope: `https://www.googleapis.com/auth/documents.readonly`

**403 / Forbidden errors:**
- Make sure the Google account you used has access to the documents
- Verify the documents aren't restricted or private
