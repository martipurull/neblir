import { getAllDocumentsInCollection } from "../../lib/fauna/functions";
import { NextResponse } from "next/server";
import { playersSchema } from "@/app/lib/schemas/players";

export async function GET() {
    try {
        const players = playersSchema.parse(await getAllDocumentsInCollection("players"))
        console.log('players', players)
        return NextResponse.json(players, { status: 200 })
    } catch (error) {
        console.error('Error fetching players', error)
        return NextResponse.json({ error: 'Failed fetching players' }, { status: 500 })
    }
}