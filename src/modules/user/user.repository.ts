import { User, Prisma } from "@prisma/client";
import { prisma } from "@core/config/database.config.js";
import { DatabaseError, DuplicateEntryError } from "@core/errors/index.js";

const UserProfileSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  username: true,
  fullName: true,
  bio: true,
  profilePic: true,
  isPrivate: true,
  isVerified: true,
  followersCount: true,
  followingCount: true,
  posts: {
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      caption: true,
      totalLikes: true,
      createdAt: true,
      media: {
        select: {
          id: true,
          url: true,
          type: true,
        },
      },
    },
  },
  _count: {
    select: { posts: true },
  },
});

export type UserProfileResult = Prisma.UserGetPayload<{ select: typeof UserProfileSelect }>;

const handlePrismaError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = (error.meta?.target as string[])?.join(",") || "unknown";
      throw new DuplicateEntryError(target);
    }
    throw new DatabaseError(error.message, error.code);
  }
  throw error as Error;
};

export const createUserRepository = (db = prisma) => ({
  findUserById: async (userId: string): Promise<User | null> => {
    return db.user.findUnique({ where: { id: userId } });
  },

  findUserByEmail: async (email: string): Promise<User | null> => {
    return db.user.findUnique({ where: { email } });
  },

  findUserByUsername: async (username: string): Promise<User | null> => {
    return db.user.findUnique({ where: { username } });
  },

  findUserByToken: async (token: string): Promise<User | null> => {
    return db.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordTokenExpiry: { gt: new Date() },
      },
    });
  },

  createUser: async (userData: Prisma.UserCreateInput): Promise<User> => {
    try {
      return await db.user.create({ data: userData });
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  updateUserById: async (userId: string, updateData: Prisma.UserUpdateInput): Promise<User> => {
    try {
      return await db.user.update({
        where: { id: userId },
        data: updateData,
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  updateUserByEmail: async (email: string, updateData: Prisma.UserUpdateInput): Promise<User> => {
    try {
      return await db.user.update({
        where: { email },
        data: updateData,
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  findUserProfileById: async (userId: string): Promise<UserProfileResult | null> => {
    return db.user.findUnique({
      where: { id: userId },
      select: UserProfileSelect,
    });
  },
});

export type UserRepository = ReturnType<typeof createUserRepository>;
export const userRepository = createUserRepository();
