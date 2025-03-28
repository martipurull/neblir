import { NextRequest, NextResponse } from "next/server";
import { deleteCharacter, getCharacter } from "@/app/lib/prisma/character";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const character = await getCharacter(id)

        return NextResponse.json(character, { status: 200 })
    } catch (error) {
        console.log('characters route GET error: ', error)
        return NextResponse.error()
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await deleteCharacter(id)

        return new NextResponse(null, { status: 204 })

    } catch (error) {
        console.log('characters route DELETE error: ', error)
        return NextResponse.error()
    }
}