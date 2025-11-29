import prisma from '@/lib/prisma'
import { BadRequestException, NotFoundException } from '@/lib/exceptions'
import type { CreateUserInput, UpdateUserInput } from '@/lib/validations'

export const userController = {
  async createUser(data: CreateUserInput) {
    return prisma.user.create({
      data,
    })
  },

  async getUsers() {
    return prisma.user.findMany()
  },

  async getUserById(id: string) {
    const userId = parseInt(id, 10)
    if (isNaN(userId)) {
      throw new BadRequestException('User ID must be a number.')
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }
    return user
  },

  async updateUser(id: string, data: UpdateUserInput) {
    const userId = parseInt(id, 10)
    if (isNaN(userId)) {
      throw new BadRequestException('User ID must be a number.')
    }
    
    // Ensure the user exists before updating
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    return prisma.user.update({
      where: { id: userId },
      data,
    })
  },

  async deleteUser(id: string) {
    const userId = parseInt(id, 10)
    if (isNaN(userId)) {
      throw new BadRequestException('User ID must be a number.')
    }
    
    // Ensure the user exists before deleting to throw a consistent NotFoundException
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    return prisma.user.delete({
      where: { id: userId },
    })
  },
}