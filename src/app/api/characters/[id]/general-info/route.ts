import { getCharacter, updateCharacter } from "@/app/lib/prisma/character";
import { generalInformationSchema } from "@/app/lib/types/character";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const requestBody = await request.json()
        const { data: parsedBody, error } = generalInformationSchema.partial().safeParse(requestBody);
        if (error) {
            return NextResponse.json({ message: error.issues }, { status: 400 })
        }
        const existingCharacter = await getCharacter(id)
        if (!existingCharacter) {
            return NextResponse.json({ message: 'Character not found' }, { status: 404 })
        }
        const newGeneralInformation = {
            ...existingCharacter.generalInformation,
            ...parsedBody
        }

        const updatedCharacter = await updateCharacter(id, {
            generalInformation: newGeneralInformation
        })

        return NextResponse.json(updatedCharacter, { status: 200 })

    } catch (error) {
        console.log('characters route PATCH error: ', error)
        return NextResponse.error()
    }
}