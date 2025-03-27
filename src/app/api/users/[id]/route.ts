import { deleteUser, getUser, updateUser } from "@/app/lib/prisma/user";
import { userUpdateSchema } from "@/app/lib/types/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getUser(id)

        return NextResponse.json(user, { status: 201 })
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

        return new NextResponse(null, { status: 204 })

    } catch (error) {
        console.log('users route DELETE error: ', error)
        return NextResponse.error()
    }
}