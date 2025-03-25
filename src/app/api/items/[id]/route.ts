import { deleteItem, getItem, updateItem } from "@/app/lib/prisma/item";
import { itemSchema } from "@/app/lib/types/item";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const item = await getItem(id)

        return new Response(JSON.stringify(item), { status: 201 })
    } catch (error) {
        console.log('items route GET error: ', error)
        return NextResponse.error()
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const requestBody = await request.json()
        const { data: parsedBody, error } = itemSchema.safeParse(requestBody);
        if (error) throw error

        const updatedItem = await updateItem(id, parsedBody)

        return NextResponse.json(updatedItem)

    } catch (error) {
        console.log('items route PATCH error: ', error)
        return NextResponse.error()
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await deleteItem(id)

        return new Response(`Item with id ${id} deleted successfully`, { status: 204 })

    } catch (error) {
        console.log('items route DELETE error: ', error)
        return NextResponse.error()
    }
}