import { createUser } from "@/app/lib/prisma/user";
import { userCreateSchema } from "@/app/lib/types/user";
import { NextRequest, NextResponse } from "next/server";
import logger from "@/logger";

export async function POST(request: NextRequest) {
    try {
        const requestBody = await request.json();
        const { data: parsedBody, error } = userCreateSchema.safeParse(requestBody);
        if (error) {
            logger.error({ method: 'POST', route: '/api/users', message: 'Error parsing user creation request', details: error })
            return NextResponse.json({ message: error.issues }, { status: 400 })
        }

        const user = await createUser(parsedBody)

        return NextResponse.json(user, { status: 201 })

    } catch (error) {
        logger.error({ method: 'POST', route: '/api/users', message: 'Error creating user', error })
        return NextResponse.error()
    }
}