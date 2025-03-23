import { z } from "zod"

const documentDataSchema = z.record(z.unknown());

export type DocumentData = z.infer<typeof documentDataSchema>