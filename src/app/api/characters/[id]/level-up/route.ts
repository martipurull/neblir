import { NextResponse } from "next/server";
import { getCharacter, updateCharacter } from "@/app/lib/prisma/character";
import { computeFieldsOnCharacterCreation } from "../../parsing";
import { levelUpRequestSchema } from "./schema";
import { parseAttributeChanges, parseCharacterBodyToCompute, parseHealthUpdate } from "./parsing";
import { auth } from "@/auth";
import { AuthNextRequest } from "@/app/lib/types/api";

export const POST = auth(async (
    request: AuthNextRequest,
    { params }
) => {
    try {
        if (!request.auth?.user) {
            return NextResponse.json(
                { message: "Unauthorised" },
                { status: 401 },
            );
        }

        const { id } = await params as { id: string }
        if (!id || typeof id !== 'string') {
            return NextResponse.json({ message: "Invalid character ID" }, { status: 400 })
        }
        if (!request.auth?.user?.characters.includes(id)) {
            return NextResponse.json({ message: "This is not one of your characters." }, { status: 403 })
        }

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
})