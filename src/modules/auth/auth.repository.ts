import { User, Account, RefreshToken, Prisma } from "@prisma/client";
import { prisma } from "@core/config/database.config.js";

export interface SaveTokenArgs {
  jti: string;
  userId: string;
  expiresAt: Date;
  browser?: string | null;
  os?: string | null;
  ipAddress?: string | null;
}

export interface RotateTokenArgs {
  oldJti: string;
  newJti: string;
  userId: string;
  expiresAt: Date;
  browser?: string | null;
  os?: string | null;
  ipAddress?: string | null;
}

export const createAuthRepository = (db = prisma) => ({
  findLinkedAccount: async (provider: string, providerAccountId: string): Promise<Account | null> => {
    return db.account.findUnique({
      where: {
        provider_providerAccountId: { provider, providerAccountId },
      },
    });
  },

  createLinkedAccount: async (userId: string, provider: string, providerAccountId: string): Promise<Account> => {
    return db.account.create({
      data: { userId, provider, providerAccountId },
    });
  },

  createUserWithAccount: async (
    userData: Omit<Prisma.UserCreateInput, "accounts">,
    providerData: Prisma.AccountCreateWithoutUserInput,
  ): Promise<User> => {
    return db.user.create({
      data: {
        ...userData,
        accounts: { create: providerData },
      },
    });
  },

  saveRefreshToken: async (input: SaveTokenArgs): Promise<RefreshToken> => {
    return db.refreshToken.create({
      data: {
        id: input.jti,
        userId: input.userId,
        expiresAt: input.expiresAt,
        browser: input.browser,
        os: input.os,
        ipAddress: input.ipAddress,
      },
    });
  },

  findRefreshToken: async (jti: string): Promise<RefreshToken | null> => {
    return db.refreshToken.findUnique({ where: { id: jti } });
  },

  deleteRefreshToken: async (jti: string): Promise<RefreshToken> => {
    return db.refreshToken.delete({ where: { id: jti } });
  },

  rotateRefreshToken: async (input: RotateTokenArgs): Promise<[RefreshToken, RefreshToken]> => {
    return db.$transaction([
      db.refreshToken.delete({ where: { id: input.oldJti } }),
      db.refreshToken.create({
        data: {
          id: input.newJti,
          userId: input.userId,
          expiresAt: input.expiresAt,
          browser: input.browser,
          os: input.os,
          ipAddress: input.ipAddress,
        },
      }),
    ]);
  },

  revokeAllSessionsForUser: async (userId: string): Promise<Prisma.BatchPayload> => {
    return db.refreshToken.deleteMany({ where: { userId } });
  },

  findAllSessionsByUserId: async (userId: string): Promise<RefreshToken[]> => {
    return db.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },
});

export type AuthRepository = ReturnType<typeof createAuthRepository>;
export const authRepository = createAuthRepository();
