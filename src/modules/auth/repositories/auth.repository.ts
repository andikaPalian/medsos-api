import { User, Account, RefreshToken, Prisma } from "@prisma/client";
import { prisma } from "../../../config/client.js";

// Query to find a linked account by provider and providerAccountId
export const findLinkedAccount = async (
  provider: string,
  providerAccountId: string,
): Promise<Account | null> => {
  return await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId,
      },
    },
  });
};

// Query to create a linked account
export const createLinkedAccount = async (
  userId: string,
  provider: string,
  providerAccountId: string,
): Promise<Account> => {
  return await prisma.account.create({
    data: {
      userId,
      provider,
      providerAccountId,
    },
  });
};

// Query to create a new user with linked account
export const createUserWithAccount = async (
  userData: Omit<Prisma.UserCreateInput, "accounts">,
  providerData: Prisma.AccountCreateWithoutUserInput,
): Promise<User> => {
  return await prisma.user.create({
    data: {
      ...userData,
      accounts: {
        create: providerData,
      },
    },
  });
};

// Query to save refresh token
export const saveRefreshToken = async (
  userId: string,
  refreshToken: string,
  expiresAt: Date,
): Promise<RefreshToken> => {
  return await prisma.refreshToken.create({
    data: {
      userId: userId,
      tokenHash: refreshToken,
      expiresAt: expiresAt,
    },
  });
};

// Query to find refresh token
export const findRefreshToken = async (tokenHash: string): Promise<RefreshToken | null> => {
  return await prisma.refreshToken.findUnique({
    where: {
      tokenHash: tokenHash,
    },
  });
};

// Query to delete refresh token
export const deleteRefreshToken = async (tokenHash: string): Promise<RefreshToken> => {
  return await prisma.refreshToken.delete({
    where: {
      tokenHash: tokenHash,
    },
  });
};

// Query to rotate refresh token
export const rotateRefreshToken = async (
  oldTokenHash: string,
  newRow: Prisma.RefreshTokenUncheckedCreateInput,
): Promise<[RefreshToken, RefreshToken]> => {
  return await prisma.$transaction([
    prisma.refreshToken.delete({
      where: {
        tokenHash: oldTokenHash,
      },
    }),
    prisma.refreshToken.create({
      data: newRow,
    }),
  ]);
};
