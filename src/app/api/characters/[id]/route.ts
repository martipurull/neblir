import { NextResponse } from "next/server";
import { deleteCharacter, getCharacter } from "@/app/lib/prisma/character";
import { auth } from "@/auth";
import { AuthNextRequest } from "@/app/lib/types/api";
import { deleteCharacterUserByCharacterId } from "@/app/lib/prisma/characterUser";
import { characterBelongsToUser } from "../checks";
import { deleteCharacterInventory } from "@/app/lib/prisma/itemCharacter";
import logger from "@/logger";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
    try {
        if (!request.auth?.user) {
            logger.error({ method: 'GET', route: '/api/characters/[id]', message: 'Unauthorised access attempt' })
            return NextResponse.json(
                { message: "Unauthorised" },
                { status: 401 },
            );
        }

        const id = await Promise.resolve(params?.id)
        if (!id || typeof id !== 'string') {
            logger.error({ method: 'GET', route: '/api/characters/[id]', message: 'Invalid character ID' });
            return NextResponse.json({ message: "Invalid character ID" }, { status: 400 })
        }
        if (!request.auth?.user?.characters.map(characterUser => characterUser.characterId).includes(id)) {
            logger.error({ method: 'GET', route: '/api/characters/[id]', message: 'Character does not belong to user', characterId: id });
            return NextResponse.json({ message: "This is not one of your characters." }, { status: 403 })
        }

        const character = await getCharacter(id)
        if (!character) {
            logger.error({ method: 'GET', route: '/api/characters/[id]', message: 'Character not found', characterId: id });
            return NextResponse.json({ message: 'Character not found' }, { status: 404 })
        }

        return NextResponse.json(character, { status: 200 })
    } catch (error) {
        logger.error({ method: 'GET', route: '/api/characters/[id]', message: 'Error fetching character', error });
        return NextResponse.error()
    }
})

export const DELETE = auth(async (
    request: AuthNextRequest,
    { params }
) => {
    try {
        if (!request.auth?.user) {
            logger.error({ method: 'DELETE', route: '/api/characters/[id]', message: 'Unauthorised' });
            return NextResponse.json(
                { message: "Unauthorised" },
                { status: 401 },
            );
        }

        const id = await Promise.resolve(params?.id)
        if (!id || typeof id !== 'string') {
            logger.error({ method: 'DELETE', route: '/api/characters/[id]', message: 'Invalid character ID', characterId: id });
            return NextResponse.json({ message: "Invalid character ID" }, { status: 400 })
        }

        if (!characterBelongsToUser(request.auth?.user?.characters, id)) {
            logger.error({ method: 'DELETE', route: '/api/characters/[id]', message: 'Character does not belong to user', characterId: id });
            return NextResponse.json({ message: "This is not one of your characters." }, { status: 403 })
        }

        await deleteCharacterUserByCharacterId(id)
        await deleteCharacterInventory(id)
        await deleteCharacter(id)

        return new NextResponse(null, { status: 204 })

    } catch (error) {
        logger.error({ method: 'DELETE', route: '/api/characters/[id]', message: 'Error deleting character', error });
        return NextResponse.error()
    }
})