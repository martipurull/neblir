import { prisma } from './client'
import { Prisma } from '@prisma/client'

export async function createPath(data: Prisma.PathCreateInput) {
    return prisma.path.create({ data })
}

export async function getPath(id: string) {
    return prisma.path.findUnique({ where: { id } })
}

export async function getPaths() {
    return prisma.path.findMany()
}

export async function updatePath(id: string, data: Prisma.PathUpdateInput) {
    return prisma.path.update({ where: { id }, data })
}

export async function deletePath(id: string) {
    return prisma.path.delete({ where: { id } })
}
