import { createGame, getUserGames } from "@/app/lib/prisma/game";
import { AuthNextRequest } from "@/app/lib/types/api";
import { gameSchema } from "@/app/lib/types/game";
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

        const requestBody = await request.json();
        const { data: parsedBody, error } = gameSchema.safeParse(requestBody);
        if (error) {
            return NextResponse.json({ message: error.issues }, { status: 400 });
        }

        const game = await createGame(parsedBody);

        return NextResponse.json(game, { status: 201 })

    } catch (error) {
        console.log('games route POST error: ', error);
        return NextResponse.error();
    }
})

// Get all games for the authenticated user
export const GET = auth(async (request: AuthNextRequest) => {
    try {
        if (!request.auth?.user) {
            return NextResponse.json(
                { message: "Unauthorised" },
                { status: 401 },
            );
        }

        const userId = request.auth.user.id;
        if (!userId) {
            return NextResponse.json(({ message: `User with id ${userId} does not exist`, status: 400 }))
        }
        const userGames = await getUserGames(userId);

        return NextResponse.json(userGames, { status: 200 });

    } catch (error) {
        console.log('games route GET error: ', error);
        return NextResponse.error();
    }
})