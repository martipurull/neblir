import { updateCharacter } from "@/app/lib/prisma/character";
import { NextRequest, NextResponse } from "next/server";
import { HealthUpdateBody, healthUpdateSchema } from "./schema";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const requestBody = await request.json()
        const { data: parsedBody, error } = healthUpdateSchema.safeParse(requestBody);
        if (error) throw error

        let updateBody: HealthUpdateBody = parsedBody
        if (parsedBody.seriousTrauma === 3) {
            updateBody = { ...updateBody, status: 'DERANGED' }
        }
        if (parsedBody.deathSaves?.failures === 3 || parsedBody.seriousPhysicalInjuries === 3) {
            updateBody = { ...updateBody, status: 'DECEASED' }
        }
        const updatedCharacter = await updateCharacter(id, { health: updateBody })

        return NextResponse.json(updatedCharacter, { status: 200 })

    } catch (error) {
        console.log('characters route PATCH error: ', error)
        return NextResponse.error()
    }
}