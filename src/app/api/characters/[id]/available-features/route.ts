// Get character's path ids and PathCharacter ranks with character id
// For each PathCharacter, getFeaturesAvailableForPathCharacter (gets features available for the character's path and pathCharacter rank)
// Combine all unique features (no duplicates) for all PathCharacters
// Return the features

import { getCharacter } from "@/app/lib/prisma/character";
import { getFeaturesAvailableForPathCharacter } from "@/app/lib/prisma/feature";
import { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
    try {
        if (!request.auth?.user) {
            return NextResponse.json(
                { message: "Unauthorised" },
                { status: 401 },
            );
        }

        const characterId = await Promise.resolve(params?.id)
        if (!characterId || typeof characterId !== 'string') {
            return NextResponse.json({ message: "Invalid character ID" }, { status: 400 })
        }
        if (!request.auth?.user?.characters.map(characterUser => characterUser.characterId).includes(characterId)) {
            return NextResponse.json({ message: "This is not one of your characters." }, { status: 403 })
        }
        const character = await getCharacter(characterId)
        if (!character) {
            return NextResponse.json({ message: 'Character not found' }, { status: 404 })
        }

        if (!character?.paths.length) {
            return NextResponse.json([], { status: 200 })
        }

        const allAvailableFeatures = (
            await Promise.all(
                character.paths.map(async (path) =>
                    await getFeaturesAvailableForPathCharacter(path.pathId, path.rank)
                )
            )
        ).flat()

        const uniqueAvailableFeatures = Array.from(
            new Set(allAvailableFeatures.map(feature => feature.id))
        )
            .map(id => allAvailableFeatures.find(feature => feature.id === id))
            .filter(feature => feature !== undefined)

        const existingIncrementalFeatures = uniqueAvailableFeatures.filter(feature => character.features.map(characterFeature => characterFeature.featureId).includes(feature.id) && feature.maxGrade > 1)
        const newFeatures = uniqueAvailableFeatures.filter(feature => !character.features.map(characterFeature => characterFeature.featureId).includes(feature.id))

        return NextResponse.json({ existingIncrementalFeatures, newFeatures }, { status: 200 })

    } catch (error) {
        console.log('available-features route GET error: ', error)
        return NextResponse.error()
    }
})