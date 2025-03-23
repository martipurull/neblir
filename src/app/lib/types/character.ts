import { z } from 'zod'
import { pathSchema } from './path'
import { itemSchema, walletSchema } from './item'

const religionSchema = z.enum([
    'Tritheology',
    'Pantritheology',
    'Chrislam',
    'Humanism',
    'Chosen Faith',
    'Fore Cast',
    'Atheist',
    'Agnostic',
])

const raceSchema = z.enum(['Kinian', 'Human', 'Fenne', 'Manfenn'])

export const generalInformationSchema = z.object({
    name: z.string(),
    age: z.number(),
    religion: religionSchema,
    profession: z.string(),
    race: raceSchema,
    birthplace: z.string(),
    level: z.number(),
    avatarURL: z.string().optional(),
})

export const healthSchema = z.object({
    innatePhysicalHealth: z.number(), // Needs to be computed
    rolledPhysicalHealth: z.number().default(10),
    maxPhysicalHealth: z.number(), // Needs to be computed
    innateMentalHealth: z.number(), // Needs to be computed
    rolledMentalHealth: z.number().default(10),
    maxMentalHealth: z.number(), // Needs to be computed
    currentPhysicalHealth: z.number(), // Computed by API
    seriousPhysicalInjuries: z.number().max(3).default(0),
    currentMentalHealth: z.number(), // Computed by API
    seriousTrauma: z.number().max(3).default(0),
    deathSaves: z.object({
        successes: z.number().max(3).default(0),
        failures: z.number().max(3).default(0)
    }).optional(),
    status: z.enum(['alive', 'deceased']).default('alive')
})

export const combatInformationSchema = z.object({
    initiativeModifier: z.number(), // Needs to be computed
    speed: z.number(), // Needs to be computed
    armourModifier: z.number().default(0),
    armourMaxHP: z.number().default(0),
    armourCurrentHP: z.number().default(0),
    GridMod: z.number().default(0),
    rangeAttackMod: z.number(), // Needs to be computed
    meleeAttackMod: z.number(), // Needs to be computed
    GridAttackMod: z.number(), // Needs to be computed
    rangeDefenceMod: z.number(), // Needs to be computed
    meleeDefenceMod: z.number(), // Needs to be computed
    GridDefenceMod: z.number(), // Needs to be computed
})

export const innateAttributesSchema = z.object({
    intelligence: z.object({
        investigation: z.number().min(1).max(5),
        memory: z.number().min(1).max(5),
        deduction: z.number().min(1).max(5),
    }),
    wisdom: z.object({
        sense: z.number().min(1).max(5),
        perception: z.number().min(1).max(5),
        insight: z.number().min(1).max(5),
    }),
    personality: z.object({
        persuasion: z.number().min(1).max(5),
        deception: z.number().min(1).max(5),
        mentality: z.number().min(1).max(5),
    }),
    strength: z.object({
        athletics: z.number().min(1).max(5),
        resilience: z.number().min(1).max(5),
        bruteForce: z.number().min(1).max(5),
    }),
    dexterity: z.object({
        manual: z.number().min(1).max(5),
        stealth: z.number().min(1).max(5),
        agility: z.number().min(1).max(5),
    }),
    constitution: z.object({
        resistanceInternal: z.number().min(1).max(5),
        resistanceExternal: z.number().min(1).max(5),
        stamina: z.number().min(1).max(5),
    })
}).refine((data) => {
    const sum = Object.values(data).reduce((acc, obj) =>
        acc + Object.values(obj).reduce((sum, value) =>
            sum + value, 0), 0)
    return sum <= 30
}, {
    message: 'The sum of all attributes must not exceed 30.',
})

export const generalSkillsSchema = z.object({
    mechanics: z.number().max(5),
    software: z.number().max(5),
    generalKnowledge: z.number().max(5),
    history: z.number().max(5),
    driving: z.number().max(5),
    acrobatics: z.number().max(5),
    aim: z.number().max(5),
    melee: z.number().max(5),
    GRID: z.number().max(5),
    research: z.number().max(5),
    medicine: z.number().max(5),
    science: z.number().max(5),
    survival: z.number().max(5),
    streetwise: z.number().max(5),
    performance: z.number().max(5),
    manipulationNegotiation: z.number().max(5),
})

const characterSchema = z.object({
    generalInformation: generalInformationSchema,
    health: healthSchema,
    combatInformation: combatInformationSchema,
    innateAttributes: innateAttributesSchema,
    learnedSkills: z.object({
        generalSkills: generalSkillsSchema,
        specialSkills: z.array(z.string()).max(3).optional(),
    }),
    path: pathSchema.optional(),
    equipment: z.array(itemSchema).optional(),
    wallet: walletSchema.optional()
})

export type Character = z.infer<typeof characterSchema>