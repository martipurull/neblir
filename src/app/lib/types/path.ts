import { z } from 'zod'

const paths = z.enum([
    'scientist/doctor',
    'survivalist',
    'anti-hero',
    'soldier',
    'con-artist',
    'sleuth',
    'nerd-hero',
])

const featureSchema = z.object({
    level: z.number().min(2),
    name: z.string(),
    description: z.string(),
    example: z.string().optional(),
})

export const pathSchema = z.object({
    name: paths,
    features: z.array(featureSchema),
})

export type Path = z.infer<typeof pathSchema>