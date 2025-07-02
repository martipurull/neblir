import { NextResponse } from "next/server";
import { characterCreationRequestSchema } from "./schemas";
import { createCharacter } from "@/app/lib/prisma/character";
import { computeFieldsOnCharacterCreation } from "./parsing";
import { auth } from "@/auth";
import { AuthNextRequest } from "@/app/lib/types/api";
import { getUser, updateUser } from "@/app/lib/prisma/user";
import { createCharacterUser } from "@/app/lib/prisma/characterUser";

export const POST = auth(async (request: AuthNextRequest) => {
    const user = request.auth?.user
    try {
        if (!user || !user.id) {
            return NextResponse.json(
                { message: "Unauthorised" },
                { status: 401 },
            );
        }

        const dbUser = await getUser(user.id)
        if (!dbUser) {
            return NextResponse.json({ message: 'No user found in DB' }, { status: 404 })
        }

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
        await createCharacterUser({ characterId: character.id, userId: user.id })
            .catch(error => {
                console.log(`Error while adding character ${character.id} to user ${user.id}: `, JSON.stringify(error))
                return NextResponse.json({ message: `Error while adding character ${character.id} to user ${user.id}.` }, { status: 500 })
            })

        return NextResponse.json(character, { status: 201 })

    } catch (error) {
        console.log('characters route POST error: ', error)
        return NextResponse.error()
    }
})