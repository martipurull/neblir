import { getCharacter, updateCharacter } from "@/app/lib/prisma/character";
import { NextResponse } from "next/server";
import { combatInformationUpdateRequestSchema } from "./schema";
import { auth } from "@/auth";
import { AuthNextRequest } from "@/app/lib/types/api";
import { characterBelongsToUser } from "../../checks";
import logger from "@/logger";
import { errorResponse } from "../../../shared/responses";

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/combat-info",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/combat-info",
        message: "Invalid character ID",
        characterId: id,
      });
      return errorResponse("Invalid character ID", 400);
    }
    if (!characterBelongsToUser(request.auth?.user?.characters, id)) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/combat-info",
        message: "Character does not belong to user",
        characterId: id,
      });
      return errorResponse("This is not one of your characters.", 403);
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } =
      combatInformationUpdateRequestSchema.safeParse(requestBody);
    if (error) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/combat-info",
        message: "Error parsing combat information update request",
        details: error,
      });
      return errorResponse("Error parsing combat information update request", 400, error.issues.map((issue) => issue.message).join(". "));
    }
    const existingCharacter = await getCharacter(id);
    if (!existingCharacter?.combatInformation) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/combat-info",
        message: "No combat information found in character",
        characterId: id,
      });
      return errorResponse("No combat information found in character", 400);
    }

    let updateBody = existingCharacter.combatInformation;
    // Handle change in current armour HP
    if (
      parsedBody.armourCurrentHP &&
      parsedBody.armourCurrentHP !==
        existingCharacter.combatInformation.armourCurrentHP
    ) {
      updateBody = {
        ...updateBody,
        armourCurrentHP: parsedBody.armourCurrentHP,
      };
    }
    // Handle armour increase / decrease
    if (
      (parsedBody.armourMod || parsedBody.armourMod === 0) &&
      parsedBody.armourMod !== existingCharacter.combatInformation.armourMod
    ) {
      updateBody = {
        ...updateBody,
        armourMod: parsedBody.armourMod,
        rangeDefenceMod:
          existingCharacter.innateAttributes.dexterity.agility +
          existingCharacter.learnedSkills.generalSkills.acrobatics +
          parsedBody.armourMod,
        meleeDefenceMod:
          existingCharacter.innateAttributes.strength.resilience +
          existingCharacter.learnedSkills.generalSkills.melee +
          parsedBody.armourMod,
        armourMaxHP: parsedBody.armourMod * 5,
      };
    }
    // Hadle GRID mod increase / decrease
    if (
      (parsedBody.GridMod || parsedBody.GridMod === 0) &&
      parsedBody.GridMod !== existingCharacter.combatInformation.GridMod
    ) {
      updateBody = {
        ...updateBody,
        GridMod: parsedBody.GridMod,
        GridDefenceMod:
          existingCharacter.innateAttributes.personality.mentality +
          existingCharacter.learnedSkills.generalSkills.GRID +
          parsedBody.GridMod,
        GridAttackMod:
          existingCharacter.innateAttributes.personality.mentality +
          existingCharacter.learnedSkills.generalSkills.GRID +
          parsedBody.GridMod,
      };
    }
    // Handle the case where the armour is destroyed
    if (parsedBody.armourCurrentHP === 0) {
      updateBody = {
        ...updateBody,
        armourMod: 0,
        rangeDefenceMod:
          existingCharacter.innateAttributes.dexterity.agility +
          existingCharacter.learnedSkills.generalSkills.acrobatics +
          0,
        meleeDefenceMod:
          existingCharacter.innateAttributes.strength.resilience +
          existingCharacter.learnedSkills.generalSkills.melee +
          0,
        armourMaxHP: 0,
      };
    }
    const updatedCharacter = await updateCharacter(id, {
      combatInformation: updateBody,
    });

    return NextResponse.json(updatedCharacter, { status: 200 });
  } catch (error) {
    logger.error({
      method: "PATCH",
      route: "/api/characters/[id]/combat-info",
      message: "Error updating combat information",
      error,
    });
    return errorResponse("Error updating combat information", 500, JSON.stringify(error));
  }
});
