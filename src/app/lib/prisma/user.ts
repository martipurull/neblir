import { prisma } from './client'
import { Prisma } from '@prisma/client'

export async function createUser(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data })
}

export async function getUser(id: string) {
    return prisma.user.findUnique({ where: { id } })
}

export async function getUserByEmail(email: string) {
    console.log('email: ', email)
    return prisma.user.findFirst({ where: { email } })
}

export async function updateUser(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data })
}

export async function deleteUser(id: string) {
    return prisma.user.delete({ where: { id } })
}
