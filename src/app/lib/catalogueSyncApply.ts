import { CATALOGUE_EXPORT_DOMAIN_ORDER } from "@/app/lib/catalogueExportResolve";
import type { CatalogueExportDomain } from "@/app/lib/catalogueExportResolve";
import type {
  CatalogueSyncApplyResult,
  CatalogueSyncApplyRow,
} from "@/app/lib/catalogueSyncDiff";
import { diffCatalogueSyncSnapshots } from "@/app/lib/catalogueSyncDiff";
import type { CatalogueSyncSnapshotData } from "@/app/lib/catalogueSyncPull";
import {
  ATTRIBUTE_PATH_API_TO_PRISMA,
  GENERAL_SKILL_API_TO_PRISMA,
} from "@/app/lib/itemModifierEnums";
import { prisma } from "@/app/lib/prisma/client";
import { Prisma, type PathName } from "@prisma/client";

const OMIT_KEYS = new Set([
  "id",
  "createdAt",
  "updatedAt",
  "protectedFromOfficialImport",
  "game",
  "attachments",
  "soldierFavouriteWeaponPathCharacters",
  "enemyInstances",
  "pathFeature",
  "FeatureCharacter",
  "PathCharacter",
  "applicableFeatures",
]);

type CatalogueRowWriter = {
  create(args: { data: Record<string, unknown> }): Promise<unknown>;
  update(args: {
    where: { id: string };
    data: Record<string, unknown>;
  }): Promise<unknown>;
};

type CatalogueSyncApplyOutcome =
  | { status: "empty" }
  | ({
      status: "applied";
      changedDomains: CatalogueExportDomain[];
    } & CatalogueSyncApplyResult);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUniqueConstraint(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function mapKnownEnum(
  data: Record<string, unknown>,
  key: string,
  map: Record<string, unknown>
) {
  if (!(key in data) || data[key] == null) return;
  const value = data[key];
  if (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(map, value)
  ) {
    data[key] = map[value];
  }
}

function catalogueSyncWriteData(
  domain: CatalogueExportDomain,
  row: Record<string, unknown>
): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (OMIT_KEYS.has(key)) continue;
    data[key] = value;
  }
  if (domain === "items") {
    mapKnownEnum(data, "modifiesAttribute", ATTRIBUTE_PATH_API_TO_PRISMA);
    mapKnownEnum(data, "modifiesSkill", GENERAL_SKILL_API_TO_PRISMA);
  }
  data.protectedFromOfficialImport = true;
  return data;
}

function catalogueRowWriter(domain: CatalogueExportDomain): CatalogueRowWriter {
  switch (domain) {
    case "items":
      return prisma.item as unknown as CatalogueRowWriter;
    case "vehicles":
      return prisma.vehicle as unknown as CatalogueRowWriter;
    case "enemies":
      return prisma.enemy as unknown as CatalogueRowWriter;
    case "paths":
      return prisma.path as unknown as CatalogueRowWriter;
    case "features":
      return prisma.feature as unknown as CatalogueRowWriter;
    case "maps":
      return prisma.map as unknown as CatalogueRowWriter;
    case "reference":
      return prisma.referenceEntry as unknown as CatalogueRowWriter;
  }
}

function indexSourceRows(
  rows: unknown[] | undefined
): Map<string, Record<string, unknown>> {
  const byId = new Map<string, Record<string, unknown>>();
  for (const row of rows ?? []) {
    if (!isRecord(row)) continue;
    if (typeof row.id !== "string" || row.id.trim() === "") continue;
    byId.set(row.id, row);
  }
  return byId;
}

function applicablePathNames(value: unknown): PathName[] {
  if (!Array.isArray(value)) return [];
  return value.filter((name): name is PathName => typeof name === "string");
}

async function syncFeaturePathLinks(
  tx: Prisma.TransactionClient,
  featureId: string,
  applicablePaths: PathName[]
) {
  await tx.pathFeature.deleteMany({ where: { featureId } });
  if (applicablePaths.length === 0) return;

  const paths = await tx.path.findMany({
    where: { name: { in: applicablePaths } },
    select: { id: true, name: true },
  });
  const found = new Set(paths.map((path) => path.name));
  const missing = applicablePaths.filter((name) => !found.has(name));
  if (missing.length > 0) {
    throw new Error(
      `No Path rows for PathName(s): ${missing.join(", ")}. Create paths first.`
    );
  }

  await tx.pathFeature.createMany({
    data: paths.map((path) => ({ pathId: path.id, featureId })),
  });
}

async function writeFeatureRow(
  id: string,
  bucket: "added" | "updated",
  data: Record<string, unknown>
) {
  const applicablePaths = applicablePathNames(data.applicablePaths);
  await prisma.$transaction(async (tx) => {
    if (bucket === "added") {
      await tx.feature.create({
        data: { ...data, id } as Prisma.FeatureUncheckedCreateInput,
      });
    } else {
      const updateData = { ...data };
      if (Array.isArray(updateData.examples)) {
        updateData.examples = { set: updateData.examples };
      }
      if (Array.isArray(updateData.applicablePaths)) {
        updateData.applicablePaths = { set: updateData.applicablePaths };
      }
      await tx.feature.update({
        where: { id },
        data: updateData as Prisma.FeatureUncheckedUpdateInput,
      });
    }
    await syncFeaturePathLinks(tx, id, applicablePaths);
  });
}

async function writeCatalogueSyncRow(
  domain: CatalogueExportDomain,
  id: string,
  bucket: "added" | "updated",
  row: Record<string, unknown>
) {
  const data = catalogueSyncWriteData(domain, row);
  if (domain === "features") {
    await writeFeatureRow(id, bucket, data);
    return;
  }
  const writer = catalogueRowWriter(domain);
  if (bucket === "added") {
    await writer.create({ data: { ...data, id } });
    return;
  }
  await writer.update({ where: { id }, data });
}

export async function applyCatalogueSyncOverlay(input: {
  source: CatalogueSyncSnapshotData;
  dest: CatalogueSyncSnapshotData;
}): Promise<CatalogueSyncApplyOutcome> {
  const diff = diffCatalogueSyncSnapshots(input);
  if (diff.totals.added + diff.totals.updated === 0) {
    return { status: "empty" };
  }

  const applied: CatalogueSyncApplyRow[] = [];
  const skipped: CatalogueSyncApplyResult["skipped"] = [];
  const failed: CatalogueSyncApplyResult["failed"] = [];
  const changedDomains: CatalogueExportDomain[] = [];

  for (const domain of CATALOGUE_EXPORT_DOMAIN_ORDER) {
    const sourceById = indexSourceRows(input.source[domain]);
    for (const row of diff.domains[domain].rows) {
      if (row.bucket === "dest-only") continue;
      if (row.bucket === "blocked") {
        skipped.push({ domain, id: row.id, reason: "blocked" });
        continue;
      }
      const sourceRow = sourceById.get(row.id);
      if (!sourceRow) {
        failed.push({
          domain,
          id: row.id,
          message: "Source Official row was missing.",
        });
        continue;
      }
      try {
        await writeCatalogueSyncRow(domain, row.id, row.bucket, sourceRow);
        applied.push({ domain, id: row.id });
        if (!changedDomains.includes(domain)) changedDomains.push(domain);
      } catch (error) {
        if (isUniqueConstraint(error)) {
          skipped.push({ domain, id: row.id, reason: "blocked" });
          continue;
        }
        failed.push({
          domain,
          id: row.id,
          message:
            error instanceof Error
              ? error.message
              : "Official overlay write failed",
        });
      }
    }
  }

  return { status: "applied", applied, skipped, failed, changedDomains };
}
