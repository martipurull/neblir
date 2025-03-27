import { createUser } from "@/app/lib/prisma/user";
import { userCreateSchema } from "@/app/lib/types/user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const requestBody = await request.json();
        const { data: parsedBody, error } = userCreateSchema.safeParse(requestBody);
        if (error) throw error

        const user = await createUser(parsedBody)

        return NextResponse.json(user, { status: 201 })

    } catch (error) {
        console.log('user route POST error: ', error)
        return NextResponse.error()
    }
}