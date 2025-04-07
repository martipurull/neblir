import { z } from 'zod'

export const paths = z.enum([
    'SCIENTIST_DOCTOR',
    'SURVIVALIST',
    'ANTI_HERO',
    'SOLDIER',
    'CON_ARTIST',
    'SLEUTH',
    'NERD_HERO',
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

export const pathUpdateSchema = pathSchema.partial().strict()

export type Path = z.infer<typeof pathSchema>