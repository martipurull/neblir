import { characterCreationRequestSchema } from "@/app/api/characters/schemas";
import { createDocument } from "./generic";

export async function createCharacter(characterData: unknown) {
    const { data, error } = characterCreationRequestSchema.safeParse(characterData)
    if (error) {
        const parsedError = `Error parsing characterCreationRequest data:\n ${error.issues.map(issue => `${issue.code} at ${issue.path.join('.')}: ${issue.message}`)}`
        console.error(parsedError)
        throw new Error(parsedError)
    }

    const faunaBody = {
        generalInformation: data.generalInformation,
        ...data.health,
        currentPhysicalHealth: data.innateAttributes.constitution.resistanceExternal + data.innateAttributes.constitution.resistanceInternal + data.innateAttributes.constitution.stamina + data.health.rolledPhysicalHealth,
        currentMentalHealth: data.innateAttributes.personality.persuasion + data.innateAttributes.personality.deception + data.innateAttributes.personality.mentality + data.health.rolledMentalHealth,
        ...data.combatInformation,
        innateAttributes: data.innateAttributes,
        learnedSkills: data.learnedSkills,
    }

    return createDocument('Characters', faunaBody)
}