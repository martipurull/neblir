import { createPath, getPaths } from "@/app/lib/prisma/path";
import { pathSchema } from "@/app/lib/types/path";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const requestBody = await request.json()
        const { data: parsedBody, error } = pathSchema.safeParse(requestBody);
        if (error) throw error

        const item = await createPath(parsedBody)

        return NextResponse.json(item, { status: 201 })

    } catch (error) {
        console.log('paths route POST error: ', error)
        return NextResponse.error()
    }
}

export async function GET() {
    try {
        const paths = await getPaths()

        return NextResponse.json(paths)

    } catch (error) {
        console.log('paths route POST error: ', error)
        return NextResponse.error()
    }
}