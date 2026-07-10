import { prisma } from "../../../config/client.js";

export const isBlockedEitherWay = async (userIdA: string, userIdB: string): Promise<boolean> => {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userIdA, blockedId: userIdB },
        { blockerId: userIdB, blockedId: userIdA },
      ],
    },
  });

  return !!block;
};
