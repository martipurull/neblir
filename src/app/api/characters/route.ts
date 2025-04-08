import { NextRequest, NextResponse } from "next/server";
import { characterCreationRequestSchema } from "./schemas";
import { createCharacter } from "@/app/lib/prisma/character";
import { computeFieldsOnCharacterCreation } from "./parsing";

export async function POST(request: NextRequest) {
    try {
        const requestBody = await request.json()
        const { data: parsedBody, error } = characterCreationRequestSchema.safeParse(requestBody);
        if (error) {
            return NextResponse.json({ message: error.issues }, { status: 400 })
        }

        const characterCreationData = computeFieldsOnCharacterCreation(parsedBody)
        if (!characterCreationData) {
            return NextResponse.json({ message: 'Error while computing character creation data' }, { status: 400 })
        }
        const character = await createCharacter(characterCreationData)

        return NextResponse.json(character, { status: 201 })

    } catch (error) {
        console.log('characters route POST error: ', error)
        return NextResponse.error()
    }
}