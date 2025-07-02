import { createItemCharacter } from "@/app/lib/prisma/itemCharacter";
import { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { characterBelongsToUser } from "../../checks";

export const POST = auth(async (
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

        const { id } = await params as { id: string }
        if (!id || typeof id !== 'string') {
            return NextResponse.json({ message: "Invalid character ID" }, { status: 400 })
        }
        if (!characterBelongsToUser(request.auth?.user?.characters, id)) {
            return NextResponse.json({ message: "This is not one of your characters." }, { status: 403 })
        }

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
})