import { getCharacter, updateCharacter } from "@/app/lib/prisma/character";
import { NextResponse } from "next/server";
import { healthUpdateSchema } from "./schema";
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
            )
        }

        const { id } = await params as { id: string }
        if (!id || typeof id !== 'string') {
            return NextResponse.json({ message: "Invalid character ID" }, { status: 400 })
        }
        if (!request.auth?.user?.characters.includes(id)) {
            return NextResponse.json({ message: "This is not one of your characters." }, { status: 403 })
        }

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
})