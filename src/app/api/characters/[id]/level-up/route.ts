// This endpoint is akin to the create character one
// It must compute all the relevant fields once the new skills and any moved attributes have been submitted
import { NextRequest, NextResponse } from "next/server";
import { getCharacter, updateCharacter } from "@/app/lib/prisma/character";
import { computeFieldsOnCharacterCreation } from "../../parsing";
import { levelUpRequestSchema } from "./schema";
import { parseAttributeChanges, parseCharacterBodyToCompute, parseHealthUpdate } from "./parsing";
import { CharacterCreationRequest } from "../../schemas";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const requestBody = await request.json()
        const { data: parsedBody, error } = levelUpRequestSchema.safeParse(requestBody);
        if (error) {
            console.log('ERROR:', JSON.stringify(error))
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }


        const existingCharacter = await getCharacter(id)
        if (!existingCharacter) {
            return NextResponse.json({ error: 'Character not found' }, { status: 404 })
        }

        const parsedHealthUpdate = parseHealthUpdate(parsedBody.healthUpdate, existingCharacter)
        if (parsedHealthUpdate.error) {
            return NextResponse.json({ error: parsedHealthUpdate.error }, { status: 400 })
        }

        const attributeChanges = parseAttributeChanges(parsedBody) as {
            from: { attribute: keyof typeof existingCharacter.innateAttributes; property: string },
            to: { attribute: keyof typeof existingCharacter.innateAttributes; property: string }
        };
        // Construct character body to compute
        const levelUpBodyToCompute = parseCharacterBodyToCompute(
            existingCharacter,
            attributeChanges,
            parsedHealthUpdate,
            parsedBody.skillImprovement
        )
        if (levelUpBodyToCompute?.error) {
            return NextResponse.json({ error: levelUpBodyToCompute.error.issues }, { status: 400 })
        }

        const characterUpdateData = computeFieldsOnCharacterCreation(levelUpBodyToCompute.updateBody)
        if (!characterUpdateData) {
            throw new Error('Error while computing character level up data.')
        }
        const updatedCharacter = await updateCharacter(id, characterUpdateData)

        return NextResponse.json(updatedCharacter, { status: 200 })

    } catch (error) {
        console.log('characters route POST error: ', error)
        return NextResponse.error()
    }
}