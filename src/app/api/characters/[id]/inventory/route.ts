import { createItemCharacter } from "@/app/lib/prisma/itemCharacter";
import { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { characterBelongsToUser } from "../../checks";
import logger from "@/logger";

export const POST = auth(async (
    request: AuthNextRequest,
    { params }
) => {
    try {
        if (!request.auth?.user) {
            logger.error({ method: 'POST', route: '/api/characters/[id]/inventory', message: 'Unauthorised access attempt' })
            return NextResponse.json(
                { message: "Unauthorised" },
                { status: 401 },
            );
        }

        const { id } = await params as { id: string }
        if (!id || typeof id !== 'string') {
            logger.error({ method: 'POST', route: '/api/characters/[id]/inventory', message: 'Invalid character ID', characterId: id })
            return NextResponse.json({ message: "Invalid character ID" }, { status: 400 })
        }
        if (!characterBelongsToUser(request.auth?.user?.characters, id)) {
            logger.error({ method: 'POST', route: '/api/characters/[id]/inventory', message: 'Character does not belong to user', characterId: id })
            return NextResponse.json({ message: "This is not one of your characters." }, { status: 403 })
        }

        const requestBody = await request.json()
        const { data, error } = z.object({ itemId: z.string() }).safeParse(requestBody)
        if (error) {
            logger.error({ method: 'POST', route: '/api/characters/[id]/inventory', message: 'Error parsing inventory request', details: error })
            return NextResponse.json({ message: error.issues }, { status: 400 })
        }

        await createItemCharacter({
            characterId: id,
            itemId: data.itemId,
        })

        return NextResponse.json("Item added to inventory", { status: 201 })
    } catch (error) {
        logger.error({ method: 'POST', route: '/api/characters/[id]/inventory', message: 'Error adding item to inventory', error })
        return NextResponse.error()
    }
})