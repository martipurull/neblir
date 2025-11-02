import fs from "fs";
import { MongoClient, ObjectId } from "mongodb";
import { parse } from "csv-parse/sync";

interface FeatureCsv {
  name: string;
  description: string;
  minPathRank: string;
  maxGrade: string;
  examples: string;
  applicablePaths: string; // CSV string, e.g. "Path1;Path2"
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
interface PathFeatureDoc {
  featureId: ObjectId;
  pathId: ObjectId;
}

async function main() {
  const featureCsvPath =
    "/Users/martipurull/Documents/Neblir/Game/data/Feature_Upload.csv";
  const pathCsvPath =
    "/Users/martipurull/Documents/Neblir/Game/data/Path_Upload.csv";

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db("neblir-dev");

  // --- Parse Features ---
  const featuresCsv: FeatureCsv[] = parse(
    fs.readFileSync(featureCsvPath).toString(),
    {
      columns: true,
      skip_empty_lines: true,
    }
  );
  const features: FeatureDoc[] = featuresCsv.map((f) => ({
    name: f.name,
    description: f.description,
    minPathRank: Number(f.minPathRank),
    maxGrade: Number(f.maxGrade),
    examples: f.examples ? f.examples.split(";").map((x) => x.trim()) : [],
    applicablePaths: f.applicablePaths
      ? f.applicablePaths.split(";").map((x) => x.trim())
      : [],
  }));

  // Insert Features
  const featureInsertRes = await db.collection("Feature").insertMany(features);
  const featureIds = featureInsertRes.insertedIds;
  // Map feature name to ObjectId
  const featureIdByName = new Map<string, ObjectId>();
  features.forEach((f, idx) => {
    featureIdByName.set(f.name, featureIds[idx]);
  });

  // --- Parse Paths ---
  const pathsCsv: PathCsv[] = parse(fs.readFileSync(pathCsvPath).toString(), {
    columns: true,
    skip_empty_lines: true,
  });
  const paths: PathDoc[] = pathsCsv.map((p) => ({
    name: p.name,
    description: p.description,
    baseFeature: p.baseFeature,
  }));

  // Insert Paths
  const pathInsertRes = await db.collection("Path").insertMany(paths);
  const pathIds = pathInsertRes.insertedIds;
  // Map path name to ObjectId
  const pathIdByName = new Map<string, ObjectId>();
  paths.forEach((p, idx) => {
    pathIdByName.set(p.name, pathIds[idx]);
  });

  // --- Create PathFeature documents ---
  const pathFeatureDocs: PathFeatureDoc[] = [];
  features.forEach((feature, idxFeature) => {
    const featureId = featureIds[idxFeature];
    feature.applicablePaths.forEach((pathName) => {
      const pathId = pathIdByName.get(pathName);
      if (!pathId) {
        console.warn(
          `Path "${pathName}" not found for feature "${feature.name}"`
        );
        return;
      }
      pathFeatureDocs.push({
        featureId,
        pathId,
      });
    });
  });

  if (pathFeatureDocs.length > 0) {
    await db.collection("PathFeature").insertMany(pathFeatureDocs);
    console.log(
      `Inserted ${pathFeatureDocs.length} PathFeature join documents.`
    );
  } else {
    console.log("No PathFeature join documents to insert.");
  }

  await client.close();
  console.log("Upload complete");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
