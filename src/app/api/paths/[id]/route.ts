import { deletePath, getPath, updatePath } from "@/app/lib/prisma/path";
import { AuthNextRequest } from "@/app/lib/types/api";
import { pathUpdateSchema } from "@/app/lib/types/path";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";

export const GET = auth(async (
    request: AuthNextRequest,
    { params }
) => {
    try {
        if (!request.auth?.user) {
            logger.error({ method: 'GET', route: '/api/paths/[id]', message: 'Unauthorised access attempt' })
            return NextResponse.json(
                { message: "Unauthorised" },
                { status: 401 },
            );
        }

        const { id } = await params as { id: string }
        if (!id || typeof id !== 'string') {
            logger.error({ method: 'GET', route: '/api/paths/[id]', message: 'Invalid path ID', pathId: id })
            return NextResponse.json({ message: "Invalid path ID" }, { status: 400 })
        }

        const path = await getPath(id)

        return NextResponse.json(path, { status: 200 })
    } catch (error) {
        logger.error({ method: 'GET', route: '/api/paths/[id]', message: 'Error fetching path', error })
        return NextResponse.error()
    }
})

export const PATCH = auth(async (
    request: AuthNextRequest,
    { params }
) => {
    try {
        if (!request.auth?.user) {
            logger.error({ method: 'PATCH', route: '/api/paths/[id]', message: 'Unauthorised access attempt' })
            return NextResponse.json(
                { message: "Unauthorised" },
                { status: 401 },
            );
        }

        const { id } = await params as { id: string }
        if (!id || typeof id !== 'string') {
            logger.error({ method: 'PATCH', route: '/api/paths/[id]', message: 'Invalid path ID', pathId: id })
            return NextResponse.json({ message: "Invalid path ID" }, { status: 400 })
        }

        const requestBody = await request.json()
        const { data: parsedBody, error } = pathUpdateSchema.safeParse(requestBody);
        if (error) {
            logger.error({ method: 'PATCH', route: '/api/paths/[id]', message: 'Error parsing path update request', details: error })
            return NextResponse.json({ message: error.issues }, { status: 400 })
        }

        const updatedItem = await updatePath(id, parsedBody)

        return NextResponse.json(updatedItem)

    } catch (error) {
        logger.error({ method: 'PATCH', route: '/api/paths/[id]', message: 'Error updating path', error })
        return NextResponse.error()
    }
})

export const DELETE = auth(async (
    request: AuthNextRequest,
    { params }
) => {
    try {
        if (!request.auth?.user) {
            logger.error({ method: 'DELETE', route: '/api/paths/[id]', message: 'Unauthorised access attempt' })
            return NextResponse.json(
                { message: "Unauthorised" },
                { status: 401 },
            );
        }

        const { id } = await params as { id: string }
        if (!id || typeof id !== 'string') {
            logger.error({ method: 'DELETE', route: '/api/paths/[id]', message: 'Invalid path ID', pathId: id })
            return NextResponse.json({ message: "Invalid path ID" }, { status: 400 })
        }

        await deletePath(id)

        return new NextResponse(null, { status: 204 })

    } catch (error) {
        logger.error({ method: 'DELETE', route: '/api/paths/[id]', message: 'Error deleting path', error })
        return NextResponse.error()
    }
})