import { User, Prisma } from "@prisma/client";
import { prisma } from "../../../config/client.js";
import { DuplicateEntryError } from "../../../common/error/domain.error.js";

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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = error.meta?.target as string[] | undefined;
      const field = target?.[0] || "fields";

      throw new DuplicateEntryError(field, `Duplicate value on field: ${field}`);
    }
    throw error;
  }
};

// Query to update user data by ID
export const updateUserById = async (
  userId: string,
  updateData: Prisma.UserUpdateInput,
): Promise<User> => {
  return await prisma.user.update({
    where: {
      id: userId,
    },
    data: updateData,
  });
};

// Query to update user data by email
export const updateUserByEmail = async (
  email: string,
  updateData: Prisma.UserUpdateInput,
): Promise<User> => {
  return await prisma.user.update({
    where: { email },
    data: updateData,
  });
};
