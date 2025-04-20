import { deleteUser, getUser, updateUser } from "@/app/lib/prisma/user";
import { AuthNextRequest } from "@/app/lib/types/api";
import { userUpdateSchema } from "@/app/lib/types/user";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const GET = auth(async (
    request: AuthNextRequest,
    { params }
) => {
    try {
        if (!request.auth?.user) {
            return NextResponse.json(
                { message: "Unauthorised" },
                { status: 401 },
            );
        }

        const { id } = await params as { id: string }
        if (!id || typeof id !== 'string') {
            return NextResponse.json({ message: "Invalid user ID" }, { status: 400 })
        }
        if (request.auth?.user?.id !== id) {
            return NextResponse.json({ status: 403 })
        }

        const user = await getUser(id)

        return NextResponse.json(user, { status: 200 })
    } catch (error) {
        console.log('users route GET error: ', error)
        return NextResponse.error()
    }
})

export const PATCH = auth(async (
    request: AuthNextRequest,
    { params }
) => {
    try {
        if (!request.auth?.user) {
            return NextResponse.json(
                { message: "Unauthorised" },
                { status: 401 },
            );
        }

        const { id } = await params as { id: string }
        if (!id || typeof id !== 'string') {
            return NextResponse.json({ message: "Invalid user ID" }, { status: 400 })
        }
        if (request.auth?.user?.id !== id) {
            return NextResponse.json({ status: 403 })
        }

        const requestBody = await request.json()
        const { data: parsedBody, error } = userUpdateSchema.safeParse(requestBody);
        if (error) throw error

        const updatedUser = await updateUser(id, parsedBody)

        return NextResponse.json(updatedUser)

    } catch (error) {
        console.log('users route PATCH error: ', error)
        return NextResponse.error()
    }
})

export const DELETE = auth(async (
    request: AuthNextRequest,
    { params }
) => {
    try {
        if (!request.auth?.user) {
            return NextResponse.json(
                { message: "Unauthorised" },
                { status: 401 },
            );
        }

        const { id } = await params as { id: string }
        if (!id || typeof id !== 'string') {
            return NextResponse.json({ message: "Invalid user ID" }, { status: 400 })
        }
        if (request.auth?.user?.id !== id) {
            return NextResponse.json({ status: 403 })
        }

        await deleteUser(id)

        return new NextResponse(null, { status: 204 })

    } catch (error) {
        console.log('users route DELETE error: ', error)
        return NextResponse.error()
    }
})