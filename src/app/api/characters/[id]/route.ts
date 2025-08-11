import { NextResponse } from "next/server";
import { deleteCharacter, getCharacter } from "@/app/lib/prisma/character";
import { auth } from "@/auth";
import { AuthNextRequest } from "@/app/lib/types/api";
import { deleteCharacterUserByCharacterId } from "@/app/lib/prisma/characterUser";
import { characterBelongsToUser } from "../checks";
import { deleteCharacterEquipment } from "@/app/lib/prisma/itemCharacter";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
    try {
        if (!request.auth?.user) {
            return NextResponse.json(
                { message: "Unauthorised" },
                { status: 401 },
            );
        }

        const id = await Promise.resolve(params?.id)
        if (!id || typeof id !== 'string') {
            return NextResponse.json({ message: "Invalid character ID" }, { status: 400 })
        }
        if (!request.auth?.user?.characters.map(characterUser => characterUser.characterId).includes(id)) {
            return NextResponse.json({ message: "This is not one of your characters." }, { status: 403 })
        }

        const character = await getCharacter(id)
        if (!character) {
            return NextResponse.json({ message: 'Character not found' }, { status: 404 })
        }

        return NextResponse.json(character, { status: 200 })
    } catch (error) {
        console.log('characters route GET error: ', error)
        return NextResponse.error()
    }
})

export const DELETE = auth(async (
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

        const id = await Promise.resolve(params?.id)
        if (!id || typeof id !== 'string') {
            return NextResponse.json({ message: "Invalid character ID" }, { status: 400 })
        }

        if (!characterBelongsToUser(request.auth?.user?.characters, id)) {
            return NextResponse.json({ message: "This is not one of your characters." }, { status: 403 })
        }

        await deleteCharacterUserByCharacterId(id)
        await deleteCharacterEquipment(id)
        await deleteCharacter(id)

        return new NextResponse(null, { status: 204 })

    } catch (error) {
        console.log('characters route DELETE error: ', error)
        return NextResponse.error()
    }
})