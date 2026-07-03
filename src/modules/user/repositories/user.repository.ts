import { User, Prisma } from "@prisma/client";
import { prisma } from "../../../config/client.js";
import { handlePrismaError } from "../../../common/utils/prismaErrorHandler.js";

const UserProfileSelct = Prisma.validator<Prisma.UserSelect>()({
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
    orderBy: {
      createdAt: "desc",
    },
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
    select: {
      posts: true,
    },
  },
});

export type UserProfileResult = Prisma.UserGetPayload<{ select: typeof UserProfileSelct }>;

// Query to find a user by ID
export const findUserById = async (userId: string): Promise<User | null> => {
  return await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
};

// Query to find a user by email
export const findUserByEmail = async (email: string): Promise<User | null> => {
  return await prisma.user.findUnique({
    where: { email },
  });
};

// Query to find a user by username
export const findUserByUsername = async (username: string): Promise<User | null> => {
  return await prisma.user.findUnique({
    where: { username },
  });
};

// Query to find a user by token
export const findUserByToken = async (token: string): Promise<User | null> => {
  return await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordTokenExpiry: {
        gt: new Date(),
      },
    },
  });
};

// Query to create a new user
export const createUser = async (userData: Prisma.UserCreateInput): Promise<User> => {
  try {
    return await prisma.user.create({
      data: userData,
    });
  } catch (error) {
    return handlePrismaError(error);
  }
};

// Query to update user data by ID
export const updateUserById = async (
  userId: string,
  updateData: Prisma.UserUpdateInput,
): Promise<User> => {
  try {
    return await prisma.user.update({
      where: {
        id: userId,
      },
      data: updateData,
    });
  } catch (error) {
    return handlePrismaError(error);
  }
};

// Query to update user data by email
export const updateUserByEmail = async (
  email: string,
  updateData: Prisma.UserUpdateInput,
): Promise<User> => {
  try {
    return await prisma.user.update({
      where: { email },
      data: updateData,
    });
  } catch (error) {
    return handlePrismaError(error);
  }
};

export const findUserProfileById = async (userId: string): Promise<UserProfileResult | null> => {
  return await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: UserProfileSelct,
  });
};
