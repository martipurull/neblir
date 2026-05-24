import { prisma } from "./client";

/** Stable id for the single drift document (override via env if needed). */
export const STAFF_CATALOGUE_DRIFT_SINGLETON_ID =
  process.env.STAFF_CATALOGUE_DRIFT_ID ?? "649c1f000000000000000001";

export type StaffCatalogueDriftStateDTO = {
  needsSeedRepoUpdate: boolean;
  touchedDomains: string[];
  updatedAt: string | null;
};

export async function getStaffCatalogueDriftState(): Promise<StaffCatalogueDriftStateDTO> {
  const row = await prisma.staffCatalogueDriftState.findUnique({
    where: { id: STAFF_CATALOGUE_DRIFT_SINGLETON_ID },
  });
  if (!row) {
    return { needsSeedRepoUpdate: false, touchedDomains: [], updatedAt: null };
  }
  return {
    needsSeedRepoUpdate: row.needsSeedRepoUpdate,
    touchedDomains: row.touchedDomains,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function touchStaffCatalogueDrift(
  domains: string[]
): Promise<void> {
  const incoming = [...new Set(domains.map((d) => d.trim()).filter(Boolean))];
  if (incoming.length === 0) return;

  const existing = await prisma.staffCatalogueDriftState.findUnique({
    where: { id: STAFF_CATALOGUE_DRIFT_SINGLETON_ID },
  });
  const merged = [
    ...new Set([...(existing?.touchedDomains ?? []), ...incoming]),
  ];

  await prisma.staffCatalogueDriftState.upsert({
    where: { id: STAFF_CATALOGUE_DRIFT_SINGLETON_ID },
    create: {
      id: STAFF_CATALOGUE_DRIFT_SINGLETON_ID,
      needsSeedRepoUpdate: true,
      touchedDomains: merged,
    },
    update: {
      needsSeedRepoUpdate: true,
      touchedDomains: merged,
    },
  });
}

export async function acknowledgeStaffCatalogueDrift(): Promise<void> {
  await prisma.staffCatalogueDriftState.upsert({
    where: { id: STAFF_CATALOGUE_DRIFT_SINGLETON_ID },
    create: {
      id: STAFF_CATALOGUE_DRIFT_SINGLETON_ID,
      needsSeedRepoUpdate: false,
      touchedDomains: [],
    },
    update: {
      needsSeedRepoUpdate: false,
      touchedDomains: [],
    },
  });
}
