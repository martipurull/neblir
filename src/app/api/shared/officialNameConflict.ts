import {
  officialNameConflicts,
  type OfficialNamedRow,
} from "@/app/lib/officialName";
import { errorResponse } from "./responses";

const OFFICIAL_NAME_TAKEN_MESSAGE = "This Official name is already taken";

export function officialNameTakenResponse() {
  return errorResponse(OFFICIAL_NAME_TAKEN_MESSAGE, 409);
}

export function officialNameConflictResponse(
  existing: ReadonlyArray<OfficialNamedRow>,
  candidate: string | undefined,
  excludeId?: string
) {
  if (candidate === undefined) return null;
  if (officialNameConflicts(existing, candidate, excludeId)) {
    return officialNameTakenResponse();
  }
  return null;
}
