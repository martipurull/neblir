import { NextRequest, NextResponse } from "next/server";
import { createCharacter } from "@/app/lib/fauna/functions/characters";

export async function POST(request: NextRequest) {
    try {
        const requestBody = await request.json()
        const character = await createCharacter(requestBody)
        return NextResponse.json(character)
    } catch (error) {
        console.log('characters route POST error: ', error)
        return NextResponse.error()
    }
}