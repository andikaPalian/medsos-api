import { Follow, FollowStatus, Prisma } from "@prisma/client";
import { prisma } from "@core/config/database.config.js";
import { DatabaseError, DuplicateEntryError } from "@core/errors/index.js";

const followerSelect = Prisma.validator<Prisma.FollowSelect>()({
  id: true,
  follower: {
    select: {
      id: true,
      username: true,
      profilePic: true,
    },
  },
});

const followingSelect = Prisma.validator<Prisma.FollowSelect>()({
  id: true,
  following: {
    select: {
      id: true,
      username: true,
      profilePic: true,
    },
  },
});

export interface FollowersAndFollowingArgs {
  userId: string;
  take: number;
  cursor: string | null;
}

export interface PendingFollowArgs {
  requesterId: string;
  targetUserId: string;
  take: number;
  cursor: string | null;
}

export interface FollowRelationResult {
  id: string;
  user: {
    id: string;
    username: string;
    profilePic: string | null;
  };
}

export interface FollowRequestArgs {
  requesterId: string;
  targetUserId: string;
  status: FollowStatus;
}

const handlePrismaError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new DuplicateEntryError("followerId_followingId");
    }
    throw new DatabaseError(error.message, error.code);
  }
  throw error as Error;
};

export const createFollowRepository = (db = prisma) => ({
  findFollow: async (followerId: string, followingId: string): Promise<Follow | null> => {
    return db.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
  },

  findFollowRequest: async ({
    requesterId,
    targetUserId,
    take,
    cursor,
  }: PendingFollowArgs): Promise<FollowRelationResult[]> => {
    const results = await db.follow.findMany({
      where: {
        followerId: requesterId,
        followingId: targetUserId,
        status: "PENDING",
      },
      select: followerSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });
    return results.map((p) => ({ id: p.id, user: p.follower }));
  },

  followersList: async ({
    userId,
    take,
    cursor,
  }: FollowersAndFollowingArgs): Promise<FollowRelationResult[]> => {
    const results = await db.follow.findMany({
      where: {
        followingId: userId,
        status: "ACCEPTED",
      },
      select: followerSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });
    return results.map((f) => ({ id: f.id, user: f.follower }));
  },

  followingList: async ({
    userId,
    take,
    cursor,
  }: FollowersAndFollowingArgs): Promise<FollowRelationResult[]> => {
    const results = await db.follow.findMany({
      where: {
        followerId: userId,
        status: "ACCEPTED",
      },
      select: followingSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });
    return results.map((f) => ({ id: f.id, user: f.following }));
  },

  createFollow: async ({ requesterId, targetUserId, status }: FollowRequestArgs): Promise<Follow> => {
    try {
      return await db.follow.upsert({
        where: {
          followerId_followingId: {
            followerId: requesterId,
            followingId: targetUserId,
          },
        },
        create: {
          followerId: requesterId,
          followingId: targetUserId,
          status,
        },
        update: { status },
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  deleteFollow: async (requesterId: string, targetUserId: string): Promise<Follow> => {
    try {
      return await db.follow.delete({
        where: {
          followerId_followingId: {
            followerId: requesterId,
            followingId: targetUserId,
          },
        },
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  updateFollow: async ({ requesterId, targetUserId, status }: FollowRequestArgs): Promise<Follow> => {
    try {
      return await db.follow.update({
        where: {
          followerId_followingId: {
            followerId: requesterId,
            followingId: targetUserId,
          },
        },
        data: { status },
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  },
});

export type FollowRepository = ReturnType<typeof createFollowRepository>;
export const followRepository = createFollowRepository();
