import "dotenv/config";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { config as loadEnvFile } from "dotenv";

// CLI scripts should honor both `.env` and `.env.local` (like app runtime).
loadEnvFile({ path: ".env" });
loadEnvFile({ path: ".env.local", override: true });

function resolveMaybeHome(input: string): string {
  if (input === "~") return process.env.HOME ?? input;
  if (input.startsWith("~/")) {
    return path.join(process.env.HOME ?? "~", input.slice(2));
  }
  return path.resolve(input);
}

function requiredEnvAny(names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value?.trim()) return resolveMaybeHome(value.trim());
  }
  throw new Error(
    `Missing required env var. Expected one of: ${names.join(", ")}`
  );
}

function optionalEnv(name: string): string | null {
  const value = process.env[name];
  if (!value?.trim()) return null;
  return resolveMaybeHome(value.trim());
}

type StepResult = {
  name: string;
  command: string;
  status: "ok" | "failed" | "skipped";
  summary: string;
};

function extractSummary(text: string): string {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return "No output";
  return lines[lines.length - 1];
}

function runScript(name: string, args: string[]): StepResult {
  const command = `npx tsx ${args.join(" ")}`;
  console.log(`\n▶ ${name}\n$ ${command}`);
  const result = spawnSync("npx", ["tsx", ...args], {
    stdio: "pipe",
    encoding: "utf8",
    env: process.env,
  });
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
  const summary = extractSummary(`${stdout}\n${stderr}`);
  if (result.status !== 0) {
    return { name, command, status: "failed", summary };
  }
  return { name, command, status: "ok", summary };
}

function printSummary(results: StepResult[], dryRun: boolean) {
  console.log("\nOfficial data seed summary:");
  console.log("| Step | Status | Output |");
  console.log("| --- | --- | --- |");
  for (const result of results) {
    console.log(
      `| ${result.name} | ${result.status.toUpperCase()} | ${result.summary.replace(/\|/g, "\\|")} |`
    );
  }
  const failed = results.find((result) => result.status === "failed");
  if (failed) {
    throw new Error(`Seed failed at step "${failed.name}" (${failed.command})`);
  }
  console.log(
    dryRun
      ? "\nOfficial data dry-run completed."
      : "\nOfficial data seed completed."
  );
}

async function main() {
  const args = process.argv.slice(2).filter((v) => v !== "--");
  const dryRun = args.includes("--dry-run");
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required.");
  }

  const itemsFile = requiredEnvAny([
    "OFFICIAL_DATA_ITEMS_FILE",
    "OFFICIAL_DATA_ITEMS_CSV",
  ]);
  const enemiesFile = requiredEnvAny([
    "OFFICIAL_DATA_ENEMIES_FILE",
    "OFFICIAL_DATA_ENEMIES_CSV",
  ]);
  const featuresFile = requiredEnvAny([
    "OFFICIAL_DATA_FEATURES_FILE",
    "OFFICIAL_DATA_FEATURES_CSV",
  ]);
  const mapsFile = optionalEnv("OFFICIAL_DATA_MAPS_FILE");
  const pathsFile = requiredEnvAny([
    "OFFICIAL_DATA_PATHS_FILE",
    "OFFICIAL_DATA_PATHS_CSV",
  ]);
  const referenceFile = optionalEnv("OFFICIAL_DATA_REFERENCE_FILE");
  const mechanicsDir = optionalEnv("OFFICIAL_DATA_REFERENCE_MECHANICS_DIR");
  const worldDir = optionalEnv("OFFICIAL_DATA_REFERENCE_WORLD_DIR");

  console.log(
    dryRun ? "Dry-running official data seed..." : "Seeding official data..."
  );

  const maybeDry = dryRun ? ["--dry-run"] : [];
  const results: StepResult[] = [];
  results.push(
    runScript("Items", [
      "prisma/scripts/upsertItemsFromFile.ts",
      itemsFile,
      ...maybeDry,
    ])
  );
  results.push(
    runScript("Paths & Features", [
      "prisma/scripts/upsertPathsAndFeaturesFromFile.ts",
      featuresFile,
      pathsFile,
      ...maybeDry,
    ])
  );
  results.push(
    runScript("Enemies", [
      "prisma/scripts/upsertEnemiesFromFile.ts",
      enemiesFile,
      ...maybeDry,
    ])
  );
  if (mapsFile) {
    results.push(
      runScript("Maps", [
        "prisma/scripts/upsertMapsFromFile.ts",
        mapsFile,
        ...maybeDry,
      ])
    );
  } else {
    results.push({
      name: "Maps",
      command: "",
      status: "skipped",
      summary: "OFFICIAL_DATA_MAPS_FILE not set",
    });
  }

  if (referenceFile) {
    results.push(
      runScript("Reference", [
        "prisma/scripts/upsertReferenceEntriesFromFile.ts",
        referenceFile,
        ...maybeDry,
      ])
    );
  } else {
    if (mechanicsDir) {
      results.push(
        runScript("Reference Mechanics", [
          "prisma/scripts/importReferenceEntries.ts",
          "MECHANICS",
          mechanicsDir,
          ...maybeDry,
        ])
      );
    } else {
      results.push({
        name: "Reference Mechanics",
        command: "",
        status: "skipped",
        summary:
          "OFFICIAL_DATA_REFERENCE_FILE or OFFICIAL_DATA_REFERENCE_MECHANICS_DIR not set",
      });
    }

    if (worldDir) {
      results.push(
        runScript("Reference World", [
          "prisma/scripts/importReferenceEntries.ts",
          "WORLD",
          worldDir,
          ...maybeDry,
        ])
      );
    } else {
      results.push({
        name: "Reference World",
        command: "",
        status: "skipped",
        summary:
          "OFFICIAL_DATA_REFERENCE_FILE or OFFICIAL_DATA_REFERENCE_WORLD_DIR not set",
      });
    }
  }
  printSummary(results, dryRun);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
