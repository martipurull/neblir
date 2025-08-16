import { NextResponse } from "next/server";
import { getCharacter, updateCharacter } from "@/app/lib/prisma/character";
import { computeFieldsOnCharacterCreation } from "../../parsing";
import { levelUpRequestSchema } from "./schema";
import { areIncrementFeaturesValid, calculateNewReactionsPerRound, parseAttributeChanges, parseCharacterBodyToCompute, parseHealthUpdate } from "./parsing";
import { auth } from "@/auth";
import { AuthNextRequest } from "@/app/lib/types/api";
import { characterBelongsToUser } from "../../checks";
import { createPathCharacter, updatePathCharacter } from "@/app/lib/prisma/pathCharacter";
import { createFeatureCharacter, getCharacterFeatures, increaseFeatureCharacterGrade } from "@/app/lib/prisma/featureCharacter";

export const POST = auth(async (
    request: AuthNextRequest,
    { params }
) => {
    try {
        if (!request.auth?.user) {
            return NextResponse.json(
                { message: "Unauthorised" },
                { status: 401 },
            );
        }

        const { id } = await params as { id: string }
        if (!id || typeof id !== 'string') {
            return NextResponse.json({ message: "Invalid character ID" }, { status: 400 })
        }
        if (!characterBelongsToUser(request.auth?.user?.characters, id)) {
            return NextResponse.json({ message: "This is not one of your characters." }, { status: 403 })
        }

        const requestBody = await request.json()
        const { data: parsedBody, error } = levelUpRequestSchema.safeParse(requestBody);
        if (error) {
            console.log('ERROR:', JSON.stringify(error))
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }

        const existingCharacter = await getCharacter(id)
        if (!existingCharacter) {
            return NextResponse.json({ error: 'Character not found' }, { status: 404 })
        }

        // If the pathId is not present, create a new PathCharacter record at rank 1
        const isNewPath = !existingCharacter.paths.map(path => path.id).includes(parsedBody.pathId)
        if (isNewPath) {
            await createPathCharacter({ characterId: id, pathId: parsedBody.pathId, rank: 1 })
        } else {
            // If the pathId is already present in the character's paths prop, increase its rank by 1
            await updatePathCharacter(parsedBody.pathId, { rank: { increment: 1 } })
        }

        // Increment grade of existing features if present and not already at max grade
        if (parsedBody.incrementalFeatureIds.length) {
            const incrementFeaturesAreValid = await areIncrementFeaturesValid(parsedBody.incrementalFeatureIds, id)
            if (incrementFeaturesAreValid) {
                await Promise.all(parsedBody.incrementalFeatureIds.map((featureId) => {
                    return increaseFeatureCharacterGrade(featureId)
                }))
            } else {
                return NextResponse.json({ error: 'Invalid increment features' }, { status: 400 })
            }
        }

        // Create CharacterFeature records for the each newFeatureId in the request body at grade 1
        if (parsedBody.newFeatureIds.length) {
            await Promise.all(parsedBody.newFeatureIds.map((newFeatureId) => {
                createFeatureCharacter({ characterId: id, featureId: newFeatureId, grade: 1 })
            }))
        }

        // Calculate new number of reactions per round if relevant
        const newReactionsPerRound = await calculateNewReactionsPerRound(existingCharacter.generalInformation.level, id)

        const healthUpdate = parseHealthUpdate(parsedBody.healthUpdate, existingCharacter)
        if (healthUpdate.error) {
            return NextResponse.json({ error: healthUpdate.error }, { status: 400 })
        }

        const attributeChanges = parseAttributeChanges(parsedBody) as {
            from: { attribute: keyof typeof existingCharacter.innateAttributes; property: string },
            to: { attribute: keyof typeof existingCharacter.innateAttributes; property: string }
        };
        // Construct character body to compute
        const levelUpBodyToCompute = parseCharacterBodyToCompute(
            existingCharacter,
            attributeChanges,
            healthUpdate,
            parsedBody.skillImprovement,
            newReactionsPerRound
        )
        if (levelUpBodyToCompute?.error) {
            return NextResponse.json({ error: levelUpBodyToCompute.error.issues }, { status: 400 })
        }

        const characterUpdateData = computeFieldsOnCharacterCreation(levelUpBodyToCompute.updateBody)
        if (!characterUpdateData) {
            throw new Error('Error while computing character level up data.')
        }
        const updatedCharacter = await updateCharacter(id, characterUpdateData)

        return NextResponse.json(updatedCharacter, { status: 200 })

    } catch (error) {
        console.log('characters route POST error: ', error)
        return NextResponse.error()
    }
})