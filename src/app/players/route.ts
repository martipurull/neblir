import { NextApiRequest, NextApiResponse } from "next";
import { getAllDocumentsInCollection, getDocumentById } from "../../../lib/fauna/functions";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const result = await getAllDocumentsInCollection("players")
        return NextResponse.json({ players: result }, { status: 200 })
    } catch (error) {
        console.error('Error fetching players', error)
        return NextResponse.json({ error: 'Failed fetching players' }, { status: 500 })
    }
}