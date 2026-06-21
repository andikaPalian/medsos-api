import { User, Account, RefreshToken, Prisma } from "@prisma/client";
import { prisma } from "../../../config/client.js";

interface SaveTokenArgs {
  jti: string;
  userId: string;
  expiresAt: Date;
  deviceInfo?: string | null;
  ipAddress?: string | null;
}

interface RotateTokenArgs {
  oldJti: string;
  newJti: string;
  userId: string;
  expiresAt: Date;
  deviceInfo?: string | null;
  ipAddress?: string | null;
}

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
export const saveRefreshToken = async (input: SaveTokenArgs): Promise<RefreshToken> => {
  return await prisma.refreshToken.create({
    data: {
      id: input.jti,
      userId: input.userId,
      expiresAt: input.expiresAt,
      deviceInfo: input.deviceInfo,
      ipAddress: input.ipAddress,
    },
  });
};

// Query to find refresh token
export const findRefreshToken = async (jti: string): Promise<RefreshToken | null> => {
  return await prisma.refreshToken.findUnique({
    where: {
      id: jti,
    },
  });
};

// Query to delete refresh token
export const deleteRefreshToken = async (jti: string): Promise<RefreshToken> => {
  return await prisma.refreshToken.delete({
    where: {
      id: jti,
    },
  });
};

// Query to rotate refresh token
export const rotateRefreshToken = async (
  input: RotateTokenArgs,
): Promise<[RefreshToken, RefreshToken]> => {
  return await prisma.$transaction([
    prisma.refreshToken.delete({
      where: {
        id: input.oldJti,
      },
    }),
    prisma.refreshToken.create({
      data: {
        id: input.newJti,
        userId: input.userId,
        expiresAt: input.expiresAt,
        deviceInfo: input.deviceInfo,
        ipAddress: input.ipAddress,
      },
    }),
  ]);
};

// Query to revoke all sessions for a user
export const revokeAllSessionForUser = async (userId: string): Promise<Prisma.BatchPayload> => {
  return await prisma.refreshToken.deleteMany({
    where: { userId },
  });
};
