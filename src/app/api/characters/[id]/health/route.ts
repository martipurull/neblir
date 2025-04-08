import { getCharacter, updateCharacter } from "@/app/lib/prisma/character";
import { NextRequest, NextResponse } from "next/server";
import { healthUpdateSchema } from "./schema";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const requestBody = await request.json()
        const { data: parsedBody, error } = healthUpdateSchema.safeParse(requestBody);
        if (error) {
            return NextResponse.json({ message: error.issues }, { status: 400 })
        }
        const existingCharacter = await getCharacter(id)
        if (!existingCharacter) {
            return NextResponse.json({ message: 'Character not found' }, { status: 404 })
        }
        if (parsedBody.currentPhysicalHealth && parsedBody.currentPhysicalHealth > existingCharacter.health.maxPhysicalHealth) {
            return NextResponse.json({ message: 'Current physical health cannot be greater than max physical health' }, { status: 400 })
        }
        if (parsedBody.currentMentalHealth && parsedBody.currentMentalHealth > existingCharacter.health.maxMentalHealth) {
            return NextResponse.json({ message: 'Current mental health cannot be greater than max mental health' }, { status: 400 })
        }
        let newHealth = {
            ...existingCharacter.health,
            ...parsedBody
        }
        if (parsedBody.seriousTrauma === 3) {
            newHealth = { ...newHealth, status: 'DERANGED' }
        }
        if (parsedBody.deathSaves?.failures === 3 || parsedBody.seriousPhysicalInjuries === 3) {
            newHealth = { ...newHealth, status: 'DECEASED' }
        }
        const updatedCharacter = await updateCharacter(id, { health: newHealth })

        return NextResponse.json(updatedCharacter, { status: 200 })

    } catch (error) {
        console.log('characters route PATCH error: ', error)
        return NextResponse.error()
    }
}