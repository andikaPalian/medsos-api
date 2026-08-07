import { NotFoundError, BadRequestError, DuplicateEntryError } from "@core/errors/index.js";
import { logger } from "@core/utils/logger.js";
import { blockRepository as defaultBlockRepo } from "./block.repository.js";
import { userRepository as defaultUserRepo } from "../user/user.repository.js";

export const createBlockService = (
  blockRepo = defaultBlockRepo,
  userRepo = defaultUserRepo,
) => ({
  blockUser: async (blockerId: string, blockedId: string): Promise<void> => {
    if (blockerId === blockedId) throw new BadRequestError("You cannot block yourself");

    const targetUser = await userRepo.findUserById(blockedId);
    if (!targetUser) throw new NotFoundError("User");

    try {
      await blockRepo.blockUser(blockerId, blockedId);
      logger.info(`[BLOCK SERVICE] User ${blockerId} blocked ${blockedId}`);
    } catch (error) {
      if (error instanceof DuplicateEntryError) return;
      throw error;
    }
  },

  unblockUser: async (blockerId: string, blockedId: string): Promise<void> => {
    const unblocked = await blockRepo.unblockUser(blockerId, blockedId);
    if (!unblocked) throw new NotFoundError("Block relationship");
    logger.info(`[BLOCK SERVICE] User ${blockerId} unblocked ${blockedId}`);
  },

  getBlockedUsers: async (blockerId: string) => {
    const blockedList = await blockRepo.getBlockedUsers(blockerId);
    return blockedList.map((item) => ({
      id: item.blocked.id,
      username: item.blocked.username,
      profilePic: item.blocked.profilePic,
      createdAt: item.createdAt,
    }));
  },
});

export type BlockService = ReturnType<typeof createBlockService>;
export const blockService = createBlockService();
