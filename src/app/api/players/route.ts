import { getAllDocumentsInCollection } from "../../lib/fauna/functions";
import { NextResponse } from "next/server";
import { playersSchema } from "@/app/lib/schemas/players";

export async function GET() {
    try {
        const result = playersSchema.parse(await getAllDocumentsInCollection("players"))
        console.log('result', result)
        return NextResponse.json({ players: result }, { status: 200 })
    } catch (error) {
        console.error('Error fetching players', error)
        return NextResponse.json({ error: 'Failed fetching players' }, { status: 500 })
    }
}