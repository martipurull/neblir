import { updateCharacter } from "@/app/lib/prisma/character";
import { equipmentSchema } from "@/app/lib/types/character";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const requestBody = await request.json()
        const { data: parsedBody, error } = equipmentSchema.safeParse(requestBody);
        if (error) throw error

        const updatedCharacter = await updateCharacter(id, { equipment: parsedBody })

        return NextResponse.json(updatedCharacter, { status: 200 })

    } catch (error) {
        console.log('characters route PATCH error: ', error)
        return NextResponse.error()
    }
}