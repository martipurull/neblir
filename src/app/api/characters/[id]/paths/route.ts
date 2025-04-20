import { updateCharacter } from "@/app/lib/prisma/character";
import { NextResponse } from "next/server";
import { characterPathsSchema } from "@/app/lib/types/character";
import { auth } from "@/auth";
import { AuthNextRequest } from "@/app/lib/types/api";

export const PATCH = auth(async (
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
        if (!request.auth?.user?.characters.includes(id)) {
            return NextResponse.json({ message: "This is not one of your characters." }, { status: 403 })
        }

        const requestBody = await request.json()
        const { data: parsedBody, error } = characterPathsSchema.safeParse(requestBody);
        if (error) {
            return NextResponse.json({ message: error.issues }, { status: 400 })
        }

        const updatedCharacter = await updateCharacter(id, { paths: parsedBody })

        return NextResponse.json(updatedCharacter, { status: 200 })

    } catch (error) {
        console.log('characters route PATCH error: ', error)
        return NextResponse.error()
    }
})