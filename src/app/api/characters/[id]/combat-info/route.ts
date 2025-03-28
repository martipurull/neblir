import { updateCharacter } from "@/app/lib/prisma/character";
import { NextRequest, NextResponse } from "next/server";
import { combatInformationUpdateSchema } from "./schema";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const requestBody = await request.json()
        const { data: parsedBody, error } = combatInformationUpdateSchema.safeParse(requestBody);
        if (error) throw error

        let updateBody = parsedBody
        if (parsedBody.armourCurrentHP === 0) {
            const rangeDefenceMod = parsedBody.rangeDefenceMod - parsedBody.armourMod
            const meleeDefenceMod = parsedBody.meleeDefenceMod - parsedBody.armourMod
            updateBody = { ...updateBody, armourMod: 0, rangeDefenceMod, meleeDefenceMod }
        }
        const updatedCharacter = await updateCharacter(id, { combatInformation: updateBody })

        return NextResponse.json(updatedCharacter, { status: 200 })

    } catch (error) {
        console.log('characters route PATCH error: ', error)
        return NextResponse.error()
    }
}