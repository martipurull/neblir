// We should be able to GET a game by id
// We should be able to DELETE a game by id
// We should be able to PATCH a game by id to add a character and user to a game

import { getGame, deleteGame, updateGame } from "@/app/lib/prisma/game";
import { auth } from "@/auth";
import { AuthNextRequest } from "@/app/lib/types/api";
import { NextResponse } from "next/server";
import { gameUpdateSchema } from "@/app/lib/types/game";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
    try {
        if (!request.auth?.user) {
            return NextResponse.json(
                { message: "Unauthorised" },
                { status: 401 },
            );
        }

        const { id } = await params as { id: string }
        if (!id || typeof id !== 'string') {
            return NextResponse.json({ message: "Invalid game ID" }, { status: 400 })
        }

        const game = await getGame(id);
        if (!game) {
            return NextResponse.json({ message: 'Game not found' }, { status: 404 })
        }

        return NextResponse.json(game, { status: 200 });
    } catch (error) {
        console.log('games route GET by id error: ', error);
        return NextResponse.error();
    }
});

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
    try {
        if (!request.auth?.user) {
            return NextResponse.json(
                { message: "Unauthorised" },
                { status: 401 },
            );
        }

        const { id } = await params as { id: string }
        if (!id || typeof id !== 'string') {
            return NextResponse.json({ message: "Invalid game ID" }, { status: 400 })
        }

        const requestBody = await request.json();
        const { data: parsedBody, error } = gameUpdateSchema.safeParse(requestBody)
        if (error) {
            return NextResponse.json({ message: error.issues }, { status: 400 })
        }

        const updatedGame = await updateGame(id, parsedBody);

        return NextResponse.json(updatedGame, { status: 200 });
    } catch (error) {
        console.log('games route PATCH error: ', error);
        return NextResponse.error();
    }
});

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
    try {
        if (!request.auth?.user) {
            return NextResponse.json(
                { message: "Unauthorised" },
                { status: 401 },
            );
        }

        const { id } = await params as { id: string }
        if (!id || typeof id !== 'string') {
            return NextResponse.json({ message: "Invalid game ID" }, { status: 400 })
        }

        await deleteGame(id);

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.log('games route DELETE error: ', error);
        return NextResponse.error();
    }
});