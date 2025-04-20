import { createItem, getItems } from "@/app/lib/prisma/item";
import { AuthNextRequest } from "@/app/lib/types/api";
import { itemSchema } from "@/app/lib/types/item";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const POST = auth(async (request: AuthNextRequest) => {
    try {
        if (!request.auth?.user) {
            return NextResponse.json(
                { message: "Unauthorised" },
                { status: 401 },
            );
        }

        const requestBody = await request.json()
        const { data: parsedBody, error } = itemSchema.safeParse(requestBody);
        if (error) throw error

        const item = JSON.stringify(await createItem(parsedBody))

        return NextResponse.json(item, { status: 201 })

    } catch (error) {
        console.log('items route POST error: ', error)
        return NextResponse.error()
    }
})

export const GET = auth(async (request: AuthNextRequest) => {
    try {
        if (!request.auth?.user) {
            return NextResponse.json(
                { message: "Unauthorised" },
                { status: 401 },
            );
        }

        const items = await getItems()

        return NextResponse.json(items)

    } catch (error) {
        console.log('items route POST error: ', error)
        return NextResponse.error()
    }
})