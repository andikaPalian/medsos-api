import { Block, Prisma } from "@prisma/client";
import { prisma } from "@core/config/database.config.js";
import { DatabaseError, DuplicateEntryError } from "@core/errors/index.js";

const blockedUserSelect = Prisma.validator<Prisma.BlockSelect>()({
  id: true,
  blocked: {
    select: {
      id: true,
      username: true,
      profilePic: true,
    },
  },
  createdAt: true,
});

export type BlockedUserResult = Prisma.BlockGetPayload<{ select: typeof blockedUserSelect }>;

const handlePrismaError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new DuplicateEntryError("blockerId_blockedId");
    }
    throw new DatabaseError(error.message, error.code);
  }
  throw error as Error;
};

export const createBlockRepository = (db = prisma) => ({
  isBlockedEitherWay: async (userIdA: string, userIdB: string): Promise<boolean> => {
    const block = await db.block.findFirst({
      where: {
        OR: [
          { blockerId: userIdA, blockedId: userIdB },
          { blockerId: userIdB, blockedId: userIdA },
        ],
      },
    });
    return !!block;
  },

  blockUser: async (blockerId: string, blockedId: string): Promise<Block> => {
    try {
      return await db.block.create({
        data: { blockerId, blockedId },
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  unblockUser: async (blockerId: string, blockedId: string): Promise<boolean> => {
    try {
      const result = await db.block.deleteMany({
        where: { blockerId, blockedId },
      });
      return result.count > 0;
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  getBlockedUsers: async (blockerId: string): Promise<BlockedUserResult[]> => {
    return db.block.findMany({
      where: { blockerId },
      select: blockedUserSelect,
      orderBy: { createdAt: "desc" },
    });
  },
});

export type BlockRepository = ReturnType<typeof createBlockRepository>;
export const blockRepository = createBlockRepository();
