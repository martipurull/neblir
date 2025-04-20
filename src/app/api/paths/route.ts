import { createPath, getPaths } from "@/app/lib/prisma/path";
import { AuthNextRequest } from "@/app/lib/types/api";
import { pathSchema } from "@/app/lib/types/path";
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
        const { data: parsedBody, error } = pathSchema.safeParse(requestBody);
        if (error) throw error

        const item = await createPath(parsedBody)

        return NextResponse.json(item, { status: 201 })

    } catch (error) {
        console.log('paths route POST error: ', error)
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

        const paths = await getPaths()

        return NextResponse.json(paths)

    } catch (error) {
        console.log('paths route POST error: ', error)
        return NextResponse.error()
    }
})