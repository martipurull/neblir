import { prisma } from './client'
import { Prisma } from '@prisma/client'

export async function createItem(data: Prisma.ItemCreateInput) {
    return prisma.item.create({ data })
}

export async function getItem(id: string) {
    return prisma.item.findUnique({ where: { id } })
}

export async function getItems() {
    return prisma.item.findMany()
}

export async function updateItem(id: string, data: Prisma.ItemUpdateInput) {
    return prisma.item.update({ where: { id }, data })
}

export async function deleteItem(id: string) {
    return prisma.item.delete({ where: { id } })
}
