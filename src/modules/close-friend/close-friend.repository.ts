import { CloseFriends, Prisma } from "@prisma/client";
import { prisma } from "@core/config/database.config.js";
import { DatabaseError, DuplicateEntryError } from "@core/errors/index.js";

const closeFriendInclude = Prisma.validator<Prisma.CloseFriendsInclude>()({
  friend: {
    select: {
      id: true,
      username: true,
      profilePic: true,
    },
  },
});

export type CloseFriendWithUser = Prisma.CloseFriendsGetPayload<{ include: typeof closeFriendInclude }>;

const handlePrismaError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new DuplicateEntryError("userId_friendId");
    }
    throw new DatabaseError(error.message, error.code);
  }
  throw error as Error;
};

export const createCloseFriendRepository = (db = prisma) => ({
  findCloseFriends: async (userId: string): Promise<CloseFriendWithUser[]> => {
    return db.closeFriends.findMany({
      where: { userId },
      include: closeFriendInclude,
      orderBy: { createdAt: "desc" },
    });
  },

  isCloseFriends: async (userId: string, friendId: string): Promise<boolean> => {
    const record = await db.closeFriends.findUnique({
      where: {
        userId_friendId: { userId, friendId },
      },
    });
    return !!record;
  },

  // Alias for backward compatibility with typo in legacy code (isCLoseFriends)
  isCLoseFriends: async (userId: string, friendId: string): Promise<boolean> => {
    const record = await db.closeFriends.findUnique({
      where: {
        userId_friendId: { userId, friendId },
      },
    });
    return !!record;
  },

  addCloseFriend: async (userId: string, friendId: string): Promise<CloseFriends> => {
    try {
      return await db.closeFriends.create({
        data: { userId, friendId },
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  removeCloseFriend: async (userId: string, friendId: string): Promise<boolean> => {
    try {
      const result = await db.closeFriends.deleteMany({
        where: { userId, friendId },
      });
      return result.count > 0;
    } catch (error) {
      return handlePrismaError(error);
    }
  },
});

export type CloseFriendRepository = ReturnType<typeof createCloseFriendRepository>;
export const closeFriendRepository = createCloseFriendRepository();
