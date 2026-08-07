import { NotFoundError, BadRequestError, DuplicateEntryError } from "@core/errors/index.js";
import { logger } from "@core/utils/logger.js";
import { closeFriendRepository as defaultCloseFriendRepo } from "./close-friend.repository.js";
import { userRepository as defaultUserRepo } from "../user/user.repository.js";

export const createCloseFriendService = (
  closeFriendRepo = defaultCloseFriendRepo,
  userRepo = defaultUserRepo,
) => ({
  addCloseFriend: async (userId: string, friendId: string): Promise<void> => {
    if (userId === friendId) throw new BadRequestError("You cannot add yourself as a close friend");

    const friendUser = await userRepo.findUserById(friendId);
    if (!friendUser) throw new NotFoundError("User");

    try {
      await closeFriendRepo.addCloseFriend(userId, friendId);
      logger.info(`[CLOSE FRIEND SERVICE] User ${userId} added ${friendId} to close friends`);
    } catch (error) {
      if (error instanceof DuplicateEntryError) return;
      throw error;
    }
  },

  removeCloseFriend: async (userId: string, friendId: string): Promise<void> => {
    const removed = await closeFriendRepo.removeCloseFriend(userId, friendId);
    if (!removed) throw new NotFoundError("Close friend relationship");
    logger.info(`[CLOSE FRIEND SERVICE] User ${userId} removed ${friendId} from close friends`);
  },

  getCloseFriends: async (userId: string) => {
    const list = await closeFriendRepo.findCloseFriends(userId);
    return list.map((item) => ({
      id: item.friend.id,
      username: item.friend.username,
      profilePic: item.friend.profilePic,
      createdAt: item.createdAt,
    }));
  },
});

export type CloseFriendService = ReturnType<typeof createCloseFriendService>;
export const closeFriendService = createCloseFriendService();
