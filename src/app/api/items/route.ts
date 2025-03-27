import { createItem, getItems } from "@/app/lib/prisma/item";
import { itemSchema } from "@/app/lib/types/item";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const requestBody = await request.json()
        const { data: parsedBody, error } = itemSchema.safeParse(requestBody);
        if (error) throw error

        const item = JSON.stringify(await createItem(parsedBody))

        return NextResponse.json(item, { status: 201 })

    } catch (error) {
        console.log('items route POST error: ', error)
        return NextResponse.error()
    }
}

export async function GET() {
    try {
        const items = await getItems()

        return NextResponse.json(items)

    } catch (error) {
        console.log('items route POST error: ', error)
        return NextResponse.error()
    }
}