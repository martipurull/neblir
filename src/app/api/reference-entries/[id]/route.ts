import {
  canReadReferenceEntry,
  canWriteGameScopedReferenceEntry,
} from "@/app/lib/authz/referenceEntry";
import { userIsSuperAdmin } from "@/app/lib/authz/superAdmin";
import {
  deleteReferenceEntry,
  getReferenceEntry,
  updateReferenceEntry,
} from "@/app/lib/prisma/referenceEntry";
import { touchStaffCatalogueDrift } from "@/app/lib/prisma/staffCatalogueDrift";
import { getGame } from "@/app/lib/prisma/game";
import { getR2Config, isDeletableUploadKey } from "@/app/lib/r2";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { referenceEntryUpdateSchema } from "@/app/lib/types/reference";
import { auth } from "@/auth";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../shared/errors";
import { errorResponse } from "../../shared/responses";

const route = "/api/reference-entries/[id]";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    const entry = await getReferenceEntry(id);
    if (!entry) {
      return errorResponse("Reference entry not found", 404);
    }

    const isSuperAdmin = await userIsSuperAdmin(request.auth.user.id);
    if (!entry.gameId && isSuperAdmin) {
      return NextResponse.json(entry, { status: 200 });
    }

    const canRead = await canReadReferenceEntry(entry, request.auth.user.id);
    if (!canRead) {
      return errorResponse("You cannot access this reference entry", 403);
    }

    return NextResponse.json(entry, { status: 200 });
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "GET",
      route,
      message: "Error fetching reference entry",
      error,
      details,
    });
    return errorResponse("Error fetching reference entry", 500, details);
  }
});

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    const existing = await getReferenceEntry(id);
    if (!existing) {
      return errorResponse("Reference entry not found", 404);
    }

    if (!existing.gameId) {
      if (!(await userIsSuperAdmin(request.auth.user.id))) {
        return errorResponse("You cannot update this reference entry", 403);
      }
    } else {
      const canWriteExisting = await canWriteGameScopedReferenceEntry(
        existing,
        request.auth.user.id
      );
      if (!canWriteExisting) {
        return errorResponse("You cannot update this reference entry", 403);
      }
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } =
      referenceEntryUpdateSchema.safeParse(requestBody);
    if (error) {
      return errorResponse(
        "Error parsing reference entry update request",
        400,
        error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const nextGameId =
      parsedBody.gameId === undefined ? existing.gameId : parsedBody.gameId;
    const nextCategory = parsedBody.category ?? existing.category;
    if (nextCategory === "CAMPAIGN_LORE" && !nextGameId) {
      return errorResponse("CAMPAIGN_LORE entries require a gameId", 400);
    }

    if (nextGameId && nextGameId !== existing.gameId) {
      const nextGame = await getGame(nextGameId);
      if (!nextGame) {
        return errorResponse("Game not found", 404);
      }
      if (nextGame.gameMaster !== request.auth.user.id) {
        return errorResponse(
          "Only the game master can move this reference entry",
          403
        );
      }
    }

    const updated = await updateReferenceEntry(id, {
      ...parsedBody,
      protectedFromOfficialImport: !nextGameId,
    });
    if (!nextGameId) {
      await touchStaffCatalogueDrift(["reference"]);
    }
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "PATCH",
      route,
      message: "Error updating reference entry",
      error,
      details,
    });
    return errorResponse("Error updating reference entry", 500, details);
  }
});

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    const existing = await getReferenceEntry(id);
    if (!existing) {
      return errorResponse("Reference entry not found", 404);
    }

    if (!existing.gameId) {
      if (!(await userIsSuperAdmin(request.auth.user.id))) {
        return errorResponse("You cannot delete this reference entry", 403);
      }
    } else {
      const canWrite = await canWriteGameScopedReferenceEntry(
        existing,
        request.auth.user.id
      );
      if (!canWrite) {
        return errorResponse("You cannot delete this reference entry", 403);
      }
    }

    const config = getR2Config();
    const attachments = existing.attachments ?? [];
    if (config) {
      for (const attachment of attachments) {
        if (!isDeletableUploadKey(attachment.fileKey)) continue;
        try {
          await config.s3Client.send(
            new DeleteObjectCommand({
              Bucket: config.bucketName,
              Key: attachment.fileKey,
            })
          );
        } catch (error) {
          logger.error({
            method: "DELETE",
            route,
            message: "Failed to delete lore attachment from storage",
            error,
            details: serializeError(error),
            fileKey: attachment.fileKey,
            attachmentId: attachment.id,
          });
        }
      }
    }

    await deleteReferenceEntry(id);
    if (!existing.gameId) {
      await touchStaffCatalogueDrift(["reference"]);
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "DELETE",
      route,
      message: "Error deleting reference entry",
      error,
      details,
    });
    return errorResponse("Error deleting reference entry", 500, details);
  }
});
