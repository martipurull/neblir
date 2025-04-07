import { getCharacter, updateCharacter } from "@/app/lib/prisma/character";
import { NextRequest, NextResponse } from "next/server";
import { characterNotesSchema } from "@/app/lib/types/character";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const requestBody = await request.json()
        const { data: parsedBody, error } = characterNotesSchema.safeParse(requestBody);
        if (error) {
            return NextResponse.json({ message: error.issues }, { status: 400 })
        }

        const updatedCharacter = await updateCharacter(id, { notes: parsedBody })

        return NextResponse.json(updatedCharacter, { status: 200 })

    } catch (error) {
        console.log('characters route PATCH error: ', error)
        return NextResponse.error()
    }
}