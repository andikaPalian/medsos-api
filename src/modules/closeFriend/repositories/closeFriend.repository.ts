import { CloseFriends } from "@prisma/client";
import { prisma } from "../../../config/client.js";

export const findCloseFriends = async (userId: string): Promise<CloseFriends[]> => {
  return await prisma.closeFriends.findMany({
    where: {
      OR: [
        {
          userId,
        },
        {
          friendId: userId,
        },
      ],
    },
  });
};

export const isCLoseFriends = async (userId: string, friendId: string): Promise<boolean> => {
  const record = await prisma.closeFriends.findUnique({
    where: {
      userId_friendId: {
        userId,
        friendId,
      },
    },
  });

  return !!record;
};
