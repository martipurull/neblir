import { deleteItem, getItem, updateItem } from "@/app/lib/prisma/item";
import { itemUpdateSchema } from "@/app/lib/types/item";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const item = await getItem(id)

        return NextResponse.json(item, { status: 201 })
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
        const { data: parsedBody, error } = itemUpdateSchema.safeParse(requestBody);
        if (error) throw error

        const updatedItem = await updateItem(id, parsedBody)

        return NextResponse.json(updatedItem)

    } catch (error) {
        console.log('items route PATCH error: ', error)
        if (error instanceof ZodError) {
            return NextResponse.json(`Bad Request:\n${error.issues.map(issue => `${issue.code} at ${issue.path}: ${issue.message}.`)}`, { status: 400 })
        }
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

        return new NextResponse(null, { status: 204 })

    } catch (error) {
        console.log('items route DELETE error: ', error)
        return NextResponse.error()
    }
}