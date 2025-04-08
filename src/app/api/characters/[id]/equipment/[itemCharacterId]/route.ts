import { deleteItemCharacter } from "@/app/lib/prisma/itemCharacter"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string, itemCharacterId: string }> }
) {
    try {
        const { itemCharacterId } = await params

        const itemCharacter = await deleteItemCharacter(itemCharacterId)
        if (!itemCharacter) {
            return NextResponse.json({ message: 'ItemCharacter not found' }, { status: 404 })
        }

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.log('characters route DELETE error: ', error)
        return NextResponse.error()
    }
}