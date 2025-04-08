import { getCharacter, updateCharacter } from "@/app/lib/prisma/character";
import { NextRequest, NextResponse } from "next/server";
import { combatInformationUpdateRequestSchema } from "./schema";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const requestBody = await request.json()
        const { data: parsedBody, error } = combatInformationUpdateRequestSchema.safeParse(requestBody);
        if (error) throw error
        const existingCharacter = await getCharacter(id)
        if (!existingCharacter?.combatInformation) {
            return NextResponse.json('No combat information found in request', { status: 400 })
        }

        let updateBody = existingCharacter.combatInformation
        // Handle change in current armour HP
        if (parsedBody.armourCurrentHP && parsedBody.armourCurrentHP !== existingCharacter.combatInformation.armourCurrentHP) {
            updateBody = {
                ...updateBody,
                armourCurrentHP: parsedBody.armourCurrentHP,
            }
        }
        // Handle armour increase / decrease
        if ((parsedBody.armourMod || parsedBody.armourMod === 0) && parsedBody.armourMod !== existingCharacter.combatInformation.armourMod) {
            updateBody = {
                ...updateBody,
                armourMod: parsedBody.armourMod,
                rangeDefenceMod: existingCharacter.innateAttributes.dexterity.agility + existingCharacter.learnedSkills.generalSkills.acrobatics + parsedBody.armourMod,
                meleeDefenceMod: existingCharacter.innateAttributes.strength.resilience + existingCharacter.learnedSkills.generalSkills.melee + parsedBody.armourMod,
                armourMaxHP: parsedBody.armourMod * 5,
            }
        }
        // Hadle GRID mod increase / decrease
        if ((parsedBody.GridMod || parsedBody.GridMod === 0) && parsedBody.GridMod !== existingCharacter.combatInformation.GridMod) {
            updateBody = {
                ...updateBody,
                GridMod: parsedBody.GridMod,
                GridDefenceMod: existingCharacter.innateAttributes.personality.mentality + existingCharacter.learnedSkills.generalSkills.GRID + parsedBody.GridMod,
                GridAttackMod: existingCharacter.innateAttributes.personality.mentality + existingCharacter.learnedSkills.generalSkills.GRID + parsedBody.GridMod,
            }
        }
        // Handle the case where the armour is destroyed
        if (parsedBody.armourCurrentHP === 0) {
            updateBody = {
                ...updateBody,
                armourMod: 0,
                rangeDefenceMod: existingCharacter.innateAttributes.dexterity.agility + existingCharacter.learnedSkills.generalSkills.acrobatics + 0,
                meleeDefenceMod: existingCharacter.innateAttributes.strength.resilience + existingCharacter.learnedSkills.generalSkills.melee + 0,
                armourMaxHP: 0,
            }
        }
        const updatedCharacter = await updateCharacter(id, { combatInformation: updateBody })

        return NextResponse.json(updatedCharacter, { status: 200 })

    } catch (error) {
        console.log('characters route PATCH error: ', error)
        return NextResponse.error()
    }
}