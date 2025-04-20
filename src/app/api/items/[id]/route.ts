import { deleteItem, getItem, updateItem } from "@/app/lib/prisma/item";
import { AuthNextRequest } from "@/app/lib/types/api";
import { itemUpdateSchema } from "@/app/lib/types/item";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

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
            return NextResponse.json({ message: "Invalid item ID" }, { status: 400 })
        }

        const item = await getItem(id)

        return NextResponse.json(item, { status: 200 })
    } catch (error) {
        console.log('items route GET error: ', error)
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
            return NextResponse.json({ message: "Invalid item ID" }, { status: 400 })
        }

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
            return NextResponse.json({ message: "Invalid item ID" }, { status: 400 })
        }

        await deleteItem(id)

        return new NextResponse(null, { status: 204 })

    } catch (error) {
        console.log('items route DELETE error: ', error)
        return NextResponse.error()
    }
})