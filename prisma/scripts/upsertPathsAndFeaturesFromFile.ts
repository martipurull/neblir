import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { MongoClient, ObjectId } from "mongodb";
import { parse } from "csv-parse/sync";

interface FeatureCsv {
  name: string;
  description: string;
  minPathRank: string;
  maxGrade: string;
  examples: string;
  applicablePaths: string;
}
interface FeatureDoc {
  name: string;
  description: string;
  minPathRank: number;
  maxGrade: number;
  examples: string[];
  applicablePaths: string[];
}
interface PathCsv {
  name: string;
  description: string;
  baseFeature: string;
}
interface PathDoc {
  name: string;
  description: string;
  baseFeature: string;
}

interface FeatureDocWithProtection extends FeatureDoc {
  protectedFromOfficialImport?: boolean;
}

interface PathDocWithProtection extends PathDoc {
  protectedFromOfficialImport?: boolean;
}
interface PathFeatureDoc {
  featureId: ObjectId;
  pathId: ObjectId;
}
type PathFeatureJsonPayload = {
  features?: FeatureDoc[];
  paths?: PathDoc[];
};

function normalizeMongoExtendedJson(value: unknown): unknown {
  if (Array.isArray(value))
    return value.map((item) => normalizeMongoExtendedJson(item));
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 1) {
      if (typeof obj.$numberInt === "string")
        return Number.parseInt(obj.$numberInt, 10);
      if (typeof obj.$numberLong === "string")
        return Number.parseInt(obj.$numberLong, 10);
      if (typeof obj.$numberDouble === "string")
        return Number.parseFloat(obj.$numberDouble);
      if (typeof obj.$oid === "string") return obj.$oid;
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k === "_id" || k === "id") continue;
      out[k] = normalizeMongoExtendedJson(v);
    }
    return out;
  }
  return value;
}

function toFeatureDoc(input: unknown, index: number): FeatureDoc {
  const normalized = normalizeMongoExtendedJson(input) as Record<
    string,
    unknown
  >;
  if (!normalized || typeof normalized !== "object") {
    throw new Error(`Invalid feature at index ${index + 1}`);
  }
  return {
    name: String(normalized.name ?? "").trim(),
    description: String(normalized.description ?? "").trim(),
    minPathRank: Number(normalized.minPathRank ?? 0),
    maxGrade: Number(normalized.maxGrade ?? 0),
    examples: Array.isArray(normalized.examples)
      ? normalized.examples.map((x) => String(x).trim()).filter(Boolean)
      : [],
    applicablePaths: Array.isArray(normalized.applicablePaths)
      ? normalized.applicablePaths.map((x) => String(x).trim()).filter(Boolean)
      : [],
  };
}

function toPathDoc(input: unknown, index: number): PathDoc {
  const normalized = normalizeMongoExtendedJson(input) as Record<
    string,
    unknown
  >;
  if (!normalized || typeof normalized !== "object") {
    throw new Error(`Invalid path at index ${index + 1}`);
  }
  return {
    name: String(normalized.name ?? "").trim(),
    description: String(normalized.description ?? "").trim(),
    baseFeature: String(normalized.baseFeature ?? "").trim(),
  };
}

function resolveMaybeHome(input: string): string {
  if (input === "~") return process.env.HOME ?? input;
  if (input.startsWith("~/")) {
    return path.join(process.env.HOME ?? "~", input.slice(2));
  }
  return path.resolve(input);
}

function usage(): never {
  console.error(
    [
      "Usage: npx tsx prisma/scripts/upsertPathsAndFeaturesFromFile.ts [feature-csv-path] [path-csv-path] [--dry-run]",
      "",
      "Path resolution order:",
      "  1) CLI args",
      "  2) OFFICIAL_DATA_FEATURES_CSV / OFFICIAL_DATA_PATHS_CSV",
    ].join("\n")
  );
  process.exit(1);
}

function requiredPath(cliValue: string | undefined, envKey: string): string {
  const raw = cliValue ?? process.env[envKey];
  if (!raw) {
    console.error(`Missing ${envKey} (or CLI argument).`);
    usage();
  }
  const resolved = resolveMaybeHome(raw);
  if (!fs.existsSync(resolved)) {
    throw new Error(`File not found for ${envKey}: ${resolved}`);
  }
  return resolved;
}

async function main() {
  const args = process.argv.slice(2).filter((v) => v !== "--");
  const dryRun = args.includes("--dry-run");
  const forceOfficialImport = args.includes("--force-official-import");
  const positional = args.filter((v) => !v.startsWith("--"));

  const featureCsvPath = requiredPath(
    positional[0],
    "OFFICIAL_DATA_FEATURES_CSV"
  );
  const pathCsvPath = requiredPath(positional[1], "OFFICIAL_DATA_PATHS_CSV");

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db();

  const featureExt = path.extname(featureCsvPath).toLowerCase();
  const pathExt = path.extname(pathCsvPath).toLowerCase();

  let features: FeatureDoc[] = [];
  let paths: PathDoc[] = [];
  if (
    featureExt === ".json" &&
    pathExt === ".json" &&
    featureCsvPath === pathCsvPath
  ) {
    const payload = JSON.parse(
      fs.readFileSync(featureCsvPath, "utf8")
    ) as PathFeatureJsonPayload;
    features = (payload.features ?? []).map((f, i) => toFeatureDoc(f, i));
    paths = (payload.paths ?? []).map((p, i) => toPathDoc(p, i));
  } else if (featureExt === ".json" || pathExt === ".json") {
    const featurePayload = JSON.parse(
      fs.readFileSync(featureCsvPath, "utf8")
    ) as FeatureDoc[] | { features?: FeatureDoc[] };
    const pathPayload = JSON.parse(fs.readFileSync(pathCsvPath, "utf8")) as
      | PathDoc[]
      | { paths?: PathDoc[] };
    const featureRaw = Array.isArray(featurePayload)
      ? featurePayload
      : (featurePayload.features ?? []);
    const pathRaw = Array.isArray(pathPayload)
      ? pathPayload
      : (pathPayload.paths ?? []);
    features = featureRaw.map((f, i) => toFeatureDoc(f, i));
    paths = pathRaw.map((p, i) => toPathDoc(p, i));
  } else {
    const featuresCsv: FeatureCsv[] = parse(
      fs.readFileSync(featureCsvPath, "utf8"),
      { columns: true, skip_empty_lines: true, trim: true }
    );
    features = featuresCsv.map((f) => ({
      name: f.name.trim(),
      description: f.description?.trim() ?? "",
      minPathRank: Number(f.minPathRank),
      maxGrade: Number(f.maxGrade),
      examples: f.examples
        ? f.examples
            .split(";")
            .map((x) => x.trim())
            .filter(Boolean)
        : [],
      applicablePaths: f.applicablePaths
        ? f.applicablePaths
            .split(";")
            .map((x) => x.trim())
            .filter(Boolean)
        : [],
    }));
    const pathsCsv: PathCsv[] = parse(fs.readFileSync(pathCsvPath, "utf8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    paths = pathsCsv.map((p) => ({
      name: p.name.trim(),
      description: p.description?.trim() ?? "",
      baseFeature: p.baseFeature.trim(),
    }));
  }

  if (dryRun) {
    console.log(
      `[dry-run] Would upsert ${features.length} features, ${paths.length} paths, and rebuild path-feature links.`
    );
    await client.close();
    return;
  }

  const featureCollection = db.collection<FeatureDocWithProtection>("Feature");
  const pathCollection = db.collection<PathDocWithProtection>("Path");
  const pathFeatureCollection = db.collection<PathFeatureDoc>("PathFeature");

  const featureIdByName = new Map<string, ObjectId>();
  for (const feature of features) {
    const existingFeature = await featureCollection.findOne(
      { name: feature.name },
      { projection: { _id: 1, protectedFromOfficialImport: 1 } }
    );
    if (existingFeature?.protectedFromOfficialImport && !forceOfficialImport) {
      console.warn(
        `[skip] Feature "${feature.name}" is protected from official import (use --force-official-import to overwrite).`
      );
      if (existingFeature._id) {
        featureIdByName.set(feature.name, existingFeature._id as ObjectId);
      }
      continue;
    }
    await featureCollection.updateOne(
      { name: feature.name },
      { $set: feature },
      { upsert: true }
    );
    const persisted = await featureCollection.findOne(
      { name: feature.name },
      { projection: { _id: 1 } }
    );
    if (!persisted?._id) {
      throw new Error(`Failed to persist feature: ${feature.name}`);
    }
    featureIdByName.set(feature.name, persisted._id as ObjectId);
  }

  const pathIdByName = new Map<string, ObjectId>();
  for (const p of paths) {
    const existingPath = await pathCollection.findOne(
      { name: p.name },
      { projection: { _id: 1, protectedFromOfficialImport: 1 } }
    );
    if (existingPath?.protectedFromOfficialImport && !forceOfficialImport) {
      console.warn(
        `[skip] Path "${p.name}" is protected from official import (use --force-official-import to overwrite).`
      );
      if (existingPath._id) {
        pathIdByName.set(p.name, existingPath._id as ObjectId);
      }
      continue;
    }
    await pathCollection.updateOne(
      { name: p.name },
      { $set: p },
      { upsert: true }
    );
    const persisted = await pathCollection.findOne(
      { name: p.name },
      { projection: { _id: 1 } }
    );
    if (!persisted?._id) {
      throw new Error(`Failed to persist path: ${p.name}`);
    }
    pathIdByName.set(p.name, persisted._id as ObjectId);
  }

  await pathFeatureCollection.deleteMany({});
  const pathFeatureDocs: PathFeatureDoc[] = [];
  for (const feature of features) {
    const featureId = featureIdByName.get(feature.name);
    if (!featureId) continue;
    for (const pathName of feature.applicablePaths) {
      const pathId = pathIdByName.get(pathName);
      if (!pathId) {
        console.warn(
          `Path "${pathName}" not found for feature "${feature.name}" (skipping link).`
        );
        continue;
      }
      pathFeatureDocs.push({ featureId, pathId });
    }
  }

  if (pathFeatureDocs.length > 0) {
    await pathFeatureCollection.insertMany(pathFeatureDocs);
  }

  await client.close();
  console.log(
    `Done. Upserted ${features.length} feature(s), ${paths.length} path(s), rebuilt ${pathFeatureDocs.length} path-feature link(s).`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
