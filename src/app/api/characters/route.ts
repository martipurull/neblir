import { NextRequest, NextResponse } from "next/server";
import { characterCreationRequestSchema, characterUpdateRequestSchema } from "./schemas";
import { createCharacter } from "@/app/lib/prisma/character";
import { computeFieldsOnCharacterCreation } from "./parsing";

export async function POST(request: NextRequest) {
    try {
        const requestBody = await request.json()
        const { data: parsedBody, error } = characterCreationRequestSchema.safeParse(requestBody);
        if (error) throw error

        const characterCreationData = computeFieldsOnCharacterCreation(parsedBody)
        const character = JSON.stringify(await createCharacter(characterCreationData))

        return new Response(character, { status: 201 })

    } catch (error) {
        console.log('characters route POST error: ', error)
        return NextResponse.error()
    }
}