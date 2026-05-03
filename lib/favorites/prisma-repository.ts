import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { prisma } from "@/lib/prisma";
import type { FavoriteRepository } from "@/lib/favorites/service";
import { DuplicateFavoriteError } from "@/lib/favorites/service";

export const prismaFavoriteRepository: FavoriteRepository = {
  listByUser(userId) {
    return prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  findBySimulation(userId, calculatorId, search) {
    return prisma.favorite.findFirst({
      where: { userId, calculatorId, search },
    });
  },

  async create(data) {
    try {
      return await prisma.favorite.create({
        data,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
        throw new DuplicateFavoriteError();
      }

      throw error;
    }
  },

  async rename(userId, id, name) {
    const result = await prisma.favorite.updateMany({
      where: { id, userId },
      data: { name },
    });

    if (result.count === 0) return null;

    return prisma.favorite.findFirst({
      where: { id, userId },
    });
  },

  async deleteById(userId, id) {
    const result = await prisma.favorite.deleteMany({
      where: { id, userId },
    });

    return result.count > 0;
  },

  async clearByUser(userId) {
    const result = await prisma.favorite.deleteMany({
      where: { userId },
    });

    return result.count;
  },
};
