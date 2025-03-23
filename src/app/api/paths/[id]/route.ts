import { deletePath, getPath, updatePath } from "@/app/lib/prisma/path";
import { pathSchema } from "@/app/lib/types/path";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const path = JSON.stringify(await getPath(id))

        return new Response(path, { status: 201 })
    } catch (error) {
        console.log('paths route GET error: ', error)
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
        const { data: parsedBody, error } = pathSchema.safeParse(requestBody);
        if (error) throw error

        const updatedItem = await updatePath(id, parsedBody)

        return NextResponse.json(updatedItem)

    } catch (error) {
        console.log('paths route PATCH error: ', error)
        return NextResponse.error()
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await deletePath(id)

        return new Response(`Path with id ${id} deleted successfully`, { status: 204 })

    } catch (error) {
        console.log('paths route DELETE error: ', error)
        return NextResponse.error()
    }
}