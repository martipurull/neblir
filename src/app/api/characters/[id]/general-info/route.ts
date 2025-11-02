import { getCharacter, updateCharacter } from "@/app/lib/prisma/character";
import { AuthNextRequest } from "@/app/lib/types/api";
import { generalInformationSchema } from "@/app/lib/types/character";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { characterBelongsToUser } from "../../checks";
import logger from "@/logger";

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/general-info",
        message: "Unauthorised access attempt",
      });
      return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/general-info",
        message: "Invalid character ID",
        characterId: id,
      });
      return NextResponse.json(
        { message: "Invalid character ID" },
        { status: 400 }
      );
    }
    if (!characterBelongsToUser(request.auth?.user?.characters, id)) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/general-info",
        message: "Character does not belong to user",
        characterId: id,
      });
      return NextResponse.json(
        { message: "This is not one of your characters." },
        { status: 403 }
      );
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } = generalInformationSchema
      .partial()
      .safeParse(requestBody);
    if (error) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/general-info",
        message: "Error parsing general information update request",
        details: error,
      });
      return NextResponse.json({ message: error.issues }, { status: 400 });
    }
    const existingCharacter = await getCharacter(id);
    if (!existingCharacter) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/general-info",
        message: "Character not found",
        characterId: id,
      });
      return NextResponse.json(
        { message: "Character not found" },
        { status: 404 }
      );
    }
    const newGeneralInformation = {
      ...existingCharacter.generalInformation,
      ...parsedBody,
    };

    const updatedCharacter = await updateCharacter(id, {
      generalInformation: newGeneralInformation,
    });

    return NextResponse.json(updatedCharacter, { status: 200 });
  } catch (error) {
    logger.error({
      method: "PATCH",
      route: "/api/characters/[id]/general-info",
      message: "Error updating general information",
      error,
    });
    return NextResponse.error();
  }
});
