import { prisma } from './client'
import { Prisma } from '@prisma/client'

export async function createPath(data: Prisma.PathCreateInput) {
    return prisma.path.create({ data })
}

export async function getPath(id: string) {
    const path = await prisma.path.findUnique({ where: { id } })

    if (!path) return null

    return {
        ...path,
        features: path.features.sort((a, b) => a.level - b.level)
    }
}

export async function getPaths() {
    const paths = await prisma.path.findMany()

    if (!paths.length) return []

    return paths.map(path => ({
        ...path,
        features: path.features.sort((a, b) => a.level - b.level)
    }))
}

export async function updatePath(id: string, data: Prisma.PathUpdateInput) {
    return prisma.path.update({ where: { id }, data })
}

export async function deletePath(id: string) {
    return prisma.path.delete({ where: { id } })
}
