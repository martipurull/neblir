import fs from "fs";
import { google, Auth } from "googleapis";

interface GoogleDocMetadata {
  name: string;
  id: string;
}

interface GoogleDocResult {
  name: string;
  id: string;
  document: any; // Google Docs API response
  fetchedAt: string;
}

interface ItemsJson {
  files: GoogleDocMetadata[];
}

async function main() {
  // Configuration
  const inputJsonPath = "/Users/martipurull/Desktop/repos/neblir/items.json";
  const outputFile = process.argv[2] || "./all-google-docs.json";

  // Get access token from environment variable or command-line argument
  const accessToken =
    process.argv[3] || process.env.GOOGLE_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(
      "Missing access token!\n\n" +
      "Get an access token from Google OAuth 2.0 Playground:\n" +
      "1. Go to https://developers.google.com/oauthplayground/\n" +
      "2. In the left panel, find 'Google Docs API v1'\n" +
      "3. Check 'https://www.googleapis.com/auth/documents.readonly'\n" +
      "4. Click 'Authorize APIs'\n" +
      "5. Sign in and grant permissions\n" +
      "6. Click 'Exchange authorization code for tokens'\n" +
      "7. Copy the 'Access token' value\n\n" +
      "Then run the script with:\n" +
      "  GOOGLE_ACCESS_TOKEN=your-token npx tsx prisma/scripts/fetchGoogleDocs.ts\n" +
      "  OR\n" +
      "  npx tsx prisma/scripts/fetchGoogleDocs.ts [output-file] [access-token]"
    );
  }

  // Read the input JSON file with Google Docs metadata
  if (!fs.existsSync(inputJsonPath)) {
    throw new Error(`Input file not found: ${inputJsonPath}`);
  }

  const itemsData: ItemsJson = JSON.parse(
    fs.readFileSync(inputJsonPath, "utf-8")
  );

  const docsMetadata = itemsData.files;
  console.log(`Found ${docsMetadata.length} documents to fetch`);

  // Initialize Google Docs API with access token
  const auth = new Auth.OAuth2Client();
  auth.setCredentials({
    access_token: accessToken,
  });

  const docs = google.docs({ version: "v1", auth });

  const results: GoogleDocResult[] = [];
  const errors: Array<{ name: string; id: string; error: string }> = [];

  // Fetch each document
  for (let i = 0; i < docsMetadata.length; i++) {
    const docMeta = docsMetadata[i];
    console.log(
      `[${i + 1}/${docsMetadata.length}] Fetching: ${docMeta.name} (${docMeta.id})`
    );

    try {
      const response = await docs.documents.get({
        documentId: docMeta.id,
      });

      const result: GoogleDocResult = {
        name: docMeta.name,
        id: docMeta.id,
        document: response.data,
        fetchedAt: new Date().toISOString(),
      };

      results.push(result);
      console.log(`  ✓ Successfully fetched`);
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      console.error(`  ✗ Error: ${errorMsg}`);
      
      // Check if token expired
      if (errorMsg.includes("401") || errorMsg.includes("Invalid Credentials") || errorMsg.includes("unauthorized")) {
        console.error(`  ⚠️  Token may have expired. Get a new one from OAuth Playground.`);
      }
      
      errors.push({
        name: docMeta.name,
        id: docMeta.id,
        error: errorMsg,
      });
    }

    // Add a small delay to avoid rate limiting
    if (i < docsMetadata.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // Save combined results with all documents' JSON content
  const combinedResults = {
    fetchedAt: new Date().toISOString(),
    totalDocuments: docsMetadata.length,
    successful: results.length,
    failed: errors.length,
    results,
    errors: errors.length > 0 ? errors : undefined,
  };

  fs.writeFileSync(outputFile, JSON.stringify(combinedResults, null, 2));
  console.log(`\n✓ All documents saved to ${outputFile}`);

  // Summary
  console.log("\n=== Summary ===");
  console.log(`Total documents: ${docsMetadata.length}`);
  console.log(`Successfully fetched: ${results.length}`);
  console.log(`Failed: ${errors.length}`);

  if (errors.length > 0) {
    console.log("\nErrors:");
    errors.forEach((err) => {
      console.log(`  - ${err.name} (${err.id}): ${err.error}`);
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
