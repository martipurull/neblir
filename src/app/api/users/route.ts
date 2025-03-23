import { createUser } from "@/app/lib/prisma/user";
import { userSchema } from "@/app/lib/types/user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const requestBody = await request.json();
        const { data: parsedBody, error } = userSchema.safeParse(requestBody);
        if (error) throw error

        const user = JSON.stringify(await createUser(parsedBody))

        return new Response(user, { status: 201 })

    } catch (error) {
        console.log('user route POST error: ', error)
        return NextResponse.error()
    }
}