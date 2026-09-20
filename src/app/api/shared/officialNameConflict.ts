import {
  officialNameConflicts,
  type OfficialNamedRow,
} from "@/app/lib/officialName";
import { isPrismaUniqueConstraintError } from "./errors";
import { errorResponse } from "./responses";

const OFFICIAL_NAME_TAKEN_MESSAGE = "This Official name is already taken";

type MaybeOfficialNamedRow = {
  id?: string | null;
  name?: string | null;
};

function officialNamedRows(
  existing: ReadonlyArray<MaybeOfficialNamedRow>
): OfficialNamedRow[] {
  const rows: OfficialNamedRow[] = [];
  for (const row of existing) {
    if (typeof row.id === "string" && typeof row.name === "string") {
      rows.push({ id: row.id, name: row.name });
    }
  }
  return rows;
}

function officialNameTakenResponse() {
  return errorResponse(OFFICIAL_NAME_TAKEN_MESSAGE, 409);
}

/** 409 when the candidate Official name is already taken; otherwise `null`. */
export function responseIfOfficialNameTaken(
  existing: ReadonlyArray<MaybeOfficialNamedRow>,
  candidate: string | undefined,
  excludeId?: string
) {
  if (candidate === undefined) return null;
  if (
    officialNameConflicts(officialNamedRows(existing), candidate, excludeId)
  ) {
    return officialNameTakenResponse();
  }
  return null;
}

/** 409 when Prisma reports an exact unique-constraint conflict; otherwise `null`. */
export function responseIfOfficialNameUniqueConstraint(error: unknown) {
  if (isPrismaUniqueConstraintError(error)) {
    return officialNameTakenResponse();
  }
  return null;
}
