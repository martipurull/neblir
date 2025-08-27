import { NextResponse } from "next/server";
import { characterCreationRequestSchema } from "./schemas";
import { createCharacter } from "@/app/lib/prisma/character";
import { computeFieldsOnCharacterCreation } from "./parsing";
import { auth } from "@/auth";
import { AuthNextRequest } from "@/app/lib/types/api";
import { getUser } from "@/app/lib/prisma/user";
import { createCharacterUser } from "@/app/lib/prisma/characterUser";
import { errorResponse } from "../shared/responses";
import { ValidationError } from "../shared/errors";

export const POST = auth(async (request: AuthNextRequest) => {
    const user = request.auth?.user
    try {
        if (!user || !user.id) {
            return errorResponse('Unauthorised', 401)
        }

        const dbUser = await getUser(user.id)
        if (!dbUser) {
            return errorResponse('No user found in DB', 404)
        }

        const requestBody = await request.json()
        const parseResult = characterCreationRequestSchema.safeParse(requestBody);
        if (!parseResult.success) {
            return errorResponse('Error parsing character creation request', 400, parseResult.error.issues.map(issue => issue.message).join('. '))
        }

        let characterCreationData
        try {
            characterCreationData = computeFieldsOnCharacterCreation(parseResult.data)
        } catch (error) {
            if (error instanceof ValidationError) {
                return errorResponse('Error while computing character attributes or skills.', 400, JSON.stringify(error))
            } else {
                console.error('Error while computing character creation data: ', error)
                return errorResponse('Error while computing character creation data', 500, JSON.stringify(error))
            }
        }

        const character = await createCharacter(characterCreationData)

        try {
            await createCharacterUser({ characterId: character.id, userId: user.id })
        } catch (error) {
            console.error(`Error while adding character ${character.id} to user ${user.id}: `, JSON.stringify(error))
            return errorResponse('Error while adding character to user', 500)
        }

        return NextResponse.json(character, { status: 201 })

    } catch (error) {
        console.error('characters route POST error: ', error)
        return errorResponse('characters route POST error: ', 500, JSON.stringify(error))
    }
})