import { createCustomEnemy } from "@/app/lib/prisma/customEnemy";
import { getGame } from "@/app/lib/prisma/game";
import { parseCustomEnemyCsv } from "@/app/lib/enemyCsv";
import { customEnemyCreateSchema } from "@/app/lib/types/enemy";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) return errorResponse("Unauthorised", 401);

    const { id: gameId } = (await params) as { id: string };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }

    const game = await getGame(gameId);
    if (!game) return errorResponse("Game not found", 404);
    if (game.gameMaster !== request.auth.user.id) {
      return errorResponse(
        "Only the game master can import custom enemies for this game.",
        403
      );
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return errorResponse('Missing file field "file" (CSV upload).', 400);
    }

    const csvText = await (file as Blob).text();
    const { rows, rowErrors } = parseCustomEnemyCsv(csvText);
    if (rows.length === 0 && rowErrors.length > 0) {
      return NextResponse.json(
        { created: 0, skipped: 0, rowErrors },
        { status: 400 }
      );
    }

    let created = 0;
    const importErrors: Array<{ line: number; message: string }> = [
      ...rowErrors,
    ];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const parsed = customEnemyCreateSchema.safeParse({
        ...row,
        gameId,
      });
      if (!parsed.success) {
        importErrors.push({
          line: i + 2,
          message: parsed.error.issues.map((e) => e.message).join("; "),
        });
        continue;
      }
      try {
        await createCustomEnemy(parsed.data);
        created += 1;
      } catch (e) {
        importErrors.push({
          line: i + 2,
          message: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return NextResponse.json({
      created,
      skipped: rows.length - created,
      rowErrors: importErrors,
    });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/games/[id]/custom-enemies/import",
      message: "Error importing custom enemies",
      error,
    });
    return errorResponse(
      "Error importing custom enemies",
      500,
      serializeError(error)
    );
  }
});
