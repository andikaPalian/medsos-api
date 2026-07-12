import { Follow, FollowStatus, Prisma } from "@prisma/client";
import { prisma } from "../../../config/client.js";
import { handlePrismaError } from "../../../common/utils/prismaErrorHandler.js";

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

interface FollowersAndFollowingArgs {
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
  requesterId: string; // follower
  targetUserId: string; // following
  status: FollowStatus;
}

// export type FollowResult = Prisma.FollowGetPayload<{ select: typeof FollowerSelect }>;

export const findFollow = async (
  followerId: string,
  followingId: string,
): Promise<Follow | null> => {
  return await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  });
};

export const findFollowRequest = async ({
  requesterId,
  targetUserId,
  take,
  cursor,
}: PendingFollowArgs): Promise<FollowRelationResult[]> => {
  const results = await prisma.follow.findMany({
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
};

export const followersList = async ({
  userId,
  take,
  cursor,
}: FollowersAndFollowingArgs): Promise<FollowRelationResult[]> => {
  const results = await prisma.follow.findMany({
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
};

export const followingList = async ({
  userId,
  take,
  cursor,
}: FollowersAndFollowingArgs): Promise<FollowRelationResult[]> => {
  const results = await prisma.follow.findMany({
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
};

export const createFollow = async ({
  requesterId,
  targetUserId,
  status,
}: FollowRequestArgs): Promise<Follow> => {
  try {
    return await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: requesterId,
          followingId: targetUserId,
        },
      },
      create: {
        followerId: requesterId,
        followingId: targetUserId,
        status: status,
      },
      update: {
        status: status,
      },
    });
  } catch (error) {
    return handlePrismaError(error);
  }
};

export const deleteFollow = async (requesterId: string, targetUserId: string): Promise<Follow> => {
  try {
    return await prisma.follow.delete({
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
};

export const updateFollow = async ({
  requesterId,
  targetUserId,
  status,
}: FollowRequestArgs): Promise<Follow> => {
  try {
    return await prisma.follow.update({
      where: {
        followerId_followingId: {
          followerId: requesterId,
          followingId: targetUserId,
        },
      },
      data: {
        status: status,
      },
    });
  } catch (error) {
    return handlePrismaError(error);
  }
};
