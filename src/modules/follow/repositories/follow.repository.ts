import { Follow, Prisma } from "@prisma/client";
import { prisma } from "../../../config/client.js";

const FollowSelect = Prisma.validator<Prisma.FollowSelect>()({
  followerId: true,
  follower: {
    select: {
      id: true,
      username: true,
      profilePic: true,
    },
  },
});

export type FollowResult = Prisma.FollowGetPayload<{ select: typeof FollowSelect }>;

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

export const followersList = async (userId: string): Promise<FollowResult[]> => {
  return await prisma.follow.findMany({
    where: {
      followingId: userId,
    },
    select: FollowSelect,
  });
};
