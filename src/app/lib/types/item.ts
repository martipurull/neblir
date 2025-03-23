import { z } from 'zod'

const currencySchema = z.object({
    currencyName: z.string(),
    quantity: z.number(),
})

export const walletSchema = z.array(currencySchema)

export type Wallet = z.infer<typeof walletSchema>

const weaponAttackRollTypeSchema = z.enum(['range', 'melee', 'GRID', 'throw'])
const weaponDamageTypeSchema = z.enum(['bullet', 'blade', 'siike', 'acid', 'fire', 'ice'])

const baseItemSchema = z.object({
    type: z.enum(['generalItem', 'weapon']),
    name: z.string(),
    imageURL: z.string().optional(),
    confCost: z.number(),
    costInfo: z.string().optional().describe('e.g. cost per unit, not for sale, illegal item, etc.'),
    description: z.string(),
    notes: z.string().optional()
})

export const generalItemSchema = baseItemSchema.extend({
    type: z.literal('generalItem'),
    usage: z.string(),
})

export type GeneralItem = z.infer<typeof generalItemSchema>

export const weaponSchema = baseItemSchema.extend({
    type: z.literal('weapon'),
    attackRoll: z.array(weaponAttackRollTypeSchema),
    damage: z.object({
        diceType: z.number(),
        numberOfDice: z.number(),
        damageType: weaponDamageTypeSchema,
    })
})

export type Weapon = z.infer<typeof weaponSchema>

export const itemSchema = z.discriminatedUnion('type', [generalItemSchema, weaponSchema])

export type Item = z.infer<typeof itemSchema>