import { deleteItemCharacter } from "@/app/lib/prisma/itemCharacter"
import { AuthNextRequest } from "@/app/lib/types/api"
import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { characterBelongsToUser } from "../../../checks"

export const DELETE = auth(async (
    request: AuthNextRequest,
    { params }
) => {
    try {
        if (!request.auth?.user) {
            return NextResponse.json(
                { message: "Unauthorised" },
                { status: 401 },
            )
        }

        const { id, itemCharacterId } = await params as { id: string, itemCharacterId: string }
        if (!id || typeof id !== 'string' || !itemCharacterId || typeof itemCharacterId !== 'string') {
            return NextResponse.json({ message: "Invalid character or itemCharacter ID" }, { status: 400 })
        }
        if (!characterBelongsToUser(request.auth?.user?.characters, id)) {
            return NextResponse.json({ message: "This is not one of your characters." }, { status: 403 })
        }

        await deleteItemCharacter(itemCharacterId)
            .catch((error) => {
                console.log('itemCharacterId Delete Error: ', JSON.stringify(error))
                return new NextResponse(`Error while deleting itemCharacter with id ${itemCharacterId}`, { status: 500 })
            })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.log('characters route DELETE error: ', error)
        return NextResponse.error()
    }
})