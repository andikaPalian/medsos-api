import { Like, Prisma } from "@prisma/client";
import { prisma } from "@core/config/database.config.js";
import { DatabaseError, DuplicateEntryError } from "@core/errors/index.js";

const handlePrismaError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new DuplicateEntryError("userId_postId");
    }
    throw new DatabaseError(error.message, error.code);
  }
  throw error as Error;
};

export const createLikeRepository = (db = prisma) => ({
  findLike: async (userId: string, postId: string): Promise<Like | null> => {
    return db.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });
  },

  findLikedPostIds: async (userId: string, postIds: string[]): Promise<Set<string>> => {
    const liked = await db.like.findMany({
      where: { userId, postId: { in: postIds } },
      select: { postId: true },
    });
    return new Set(liked.map((l) => l.postId));
  },

  addLike: async (userId: string, postId: string): Promise<void> => {
    try {
      await db.$transaction(async (tx) => {
        await tx.like.create({
          data: { userId, postId },
        });

        await tx.post.update({
          where: { id: postId },
          data: { totalLikes: { increment: 1 } },
        });
      });
    } catch (error) {
      handlePrismaError(error);
    }
  },

  removeLike: async (userId: string, postId: string): Promise<void> => {
    try {
      await db.$transaction(async (tx) => {
        await tx.like.delete({
          where: { userId_postId: { userId, postId } },
        });

        await tx.post.update({
          where: { id: postId },
          data: { totalLikes: { decrement: 1 } },
        });
      });
    } catch (error) {
      handlePrismaError(error);
    }
  },
});

export type LikeRepository = ReturnType<typeof createLikeRepository>;
export const likeRepository = createLikeRepository();
