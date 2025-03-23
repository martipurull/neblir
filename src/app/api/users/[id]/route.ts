import { deleteUser, getUser, updateUser } from "@/app/lib/prisma/user";
import { userUpdateSchema } from "@/app/lib/types/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = JSON.stringify(await getUser(id))

        return new Response(user, { status: 201 })
    } catch (error) {
        console.log('users route GET error: ', error)
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
        const { data: parsedBody, error } = userUpdateSchema.safeParse(requestBody);
        if (error) throw error

        const updatedUser = await updateUser(id, parsedBody)

        return NextResponse.json(updatedUser)

    } catch (error) {
        console.log('users route PATCH error: ', error)
        return NextResponse.error()
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await deleteUser(id)

        return new Response(`User with id ${id} deleted successfully`, { status: 204 })

    } catch (error) {
        console.log('users route DELETE error: ', error)
        return NextResponse.error()
    }
}