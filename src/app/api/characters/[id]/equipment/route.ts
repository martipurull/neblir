import { createItemCharacter } from "@/app/lib/prisma/itemCharacter";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const requestBody = await request.json()
        const { data, error } = z.object({ itemId: z.string() }).safeParse(requestBody)
        if (error) {
            return NextResponse.json({ message: error.issues }, { status: 400 })
        }

        await createItemCharacter({
            characterId: id,
            itemId: data.itemId,
        })

        return NextResponse.json("Item added to equipment", { status: 201 })
    } catch (error) {
        console.log('characters route POST error: ', error)
        return NextResponse.error()
    }
}