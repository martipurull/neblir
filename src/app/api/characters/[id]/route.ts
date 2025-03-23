import { NextRequest, NextResponse } from "next/server";
import { characterUpdateRequestSchema } from "../schemas";
import { deleteCharacter, getCharacter, updateCharacter } from "@/app/lib/prisma/character";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const character = JSON.stringify(await getCharacter(id))

        return new Response(character, { status: 201 })
    } catch (error) {
        console.log('characters route GET error: ', error)
        return NextResponse.error()
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const requestBody = await request.json()
        const { data: parsedBody, error } = characterUpdateRequestSchema.safeParse(requestBody);
        if (error) throw error

        const updatedCharacter = await updateCharacter(id, parsedBody)

        return NextResponse.json(updatedCharacter)

    } catch (error) {
        console.log('characters route PATCH error: ', error)
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

        return new Response(`Character with id ${id} deleted successfully`, { status: 204 })

    } catch (error) {
        console.log('characters route DELETE error: ', error)
        return NextResponse.error()
    }
}