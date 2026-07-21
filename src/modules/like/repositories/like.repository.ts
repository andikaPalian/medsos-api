import { handlePrismaError } from "../../../common/utils/prismaErrorHandler.js";
import { prisma } from "../../../config/client.js";
import { Like } from "@prisma/client";

export const findLike = async (userId: string, postId: string): Promise<Like | null> => {
  return await prisma.like.findUnique({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });
};

export const findLikedPostIds = async (userId: string, postIds: string[]): Promise<Set<string>> => {
  const liked = await prisma.like.findMany({
    where: {
      userId,
      postId: {
        in: postIds,
      },
    },
    select: {
      postId: true,
    },
  });

  return new Set(liked.map((l) => l.postId));
};

export const addLike = async (userId: string, postId: string): Promise<void> => {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.like.create({
        data: {
          userId,
          postId,
        },
      });

      await prisma.post.update({
        where: {
          id: postId,
        },
        data: {
          totalLikes: {
            increment: 1,
          },
        },
      });
    });
  } catch (error) {
    handlePrismaError(error);
  }
};

export const removeLike = async (userId: string, postId: string): Promise<void> => {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.like.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      await tx.post.update({
        where: {
          id: postId,
        },
        data: {
          totalLikes: {
            decrement: 1,
          },
        },
      });
    });
  } catch (error) {
    handlePrismaError(error);
  }
};
