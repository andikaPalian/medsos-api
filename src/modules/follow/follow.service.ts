import { NotFoundError, ForbiddenError, BadRequestError } from "@core/errors/index.js";
import { logger } from "@core/utils/logger.js";
import { paginateCursor, clampLimit } from "@core/utils/pagination.util.js";
import { PAGINATION } from "@core/constants/app.constants.js";
import { FollowStatus } from "@prisma/client";
import { FollowUserDTO, PaginatedFollowersDTO, UserFollowDTO } from "./dto/follow-response.dto.js";
import { FollowDirection, FollowDTO } from "./dto/follow-request.dto.js";
import { followRepository as defaultFollowRepo } from "./follow.repository.js";
import { userRepository as defaultUserRepo } from "@modules/user/user.repository.js";
import { blockRepository as defaultBlockRepo } from "@modules/block/block.repository.js";

export const createFollowService = (
  followRepo = defaultFollowRepo,
  userRepo = defaultUserRepo,
  blockRepo = defaultBlockRepo,
) => ({
  listFollowRelations: async (
    direction: FollowDirection,
    { requesterId, targetUserId, cursor, limit }: FollowDTO,
  ): Promise<PaginatedFollowersDTO> => {
    const take = clampLimit(limit, PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

    const targetUser = await userRepo.findUserById(targetUserId);
    if (!targetUser) throw new NotFoundError("User");

    if (requesterId !== targetUserId && targetUser.isPrivate) {
      const followRecord = await followRepo.findFollow(requesterId, targetUserId);
      if (!followRecord || followRecord.status !== "ACCEPTED") {
        logger.warn(
          `[FOLLOW SERVICE] Blocked access to private profile: ${targetUserId} by ${requesterId}`,
        );
        throw new ForbiddenError("This account is private");
      }
    }

    const rawResult =
      direction === "FOLLOWERS"
        ? await followRepo.followersList({ userId: targetUserId, take: take + 1, cursor })
        : await followRepo.followingList({ userId: targetUserId, take: take + 1, cursor });

    const { items, nextCursor, hasNextPage } = paginateCursor(rawResult, take, (f) => f.id);

    const data: UserFollowDTO[] = items.map((item) => ({
      id: item.user.id,
      username: item.user.username,
      profilePic: item.user.profilePic,
    }));

    return { data, nextCursor, hasNextPage };
  },

  listFollowRequests: async ({
    requesterId,
    targetUserId,
    cursor,
    limit,
  }: FollowDTO): Promise<PaginatedFollowersDTO> => {
    const take = clampLimit(limit, PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

    const rawResult = await followRepo.findFollowRequest({
      requesterId,
      targetUserId,
      take: take + 1,
      cursor,
    });

    const { items, nextCursor, hasNextPage } = paginateCursor(rawResult, take, (f) => f.id);

    const data: UserFollowDTO[] = items.map((item) => ({
      id: item.user.id,
      username: item.user.username,
      profilePic: item.user.profilePic,
    }));

    return { data, nextCursor, hasNextPage };
  },

  followUser: async (requesterId: string, targetUserId: string): Promise<FollowUserDTO> => {
    if (requesterId === targetUserId) throw new BadRequestError("You cannot follow yourself");

    const targetUser = await userRepo.findUserById(targetUserId);
    if (!targetUser) throw new NotFoundError("User");

    const isBlocked = await blockRepo.isBlockedEitherWay(requesterId, targetUserId);
    if (isBlocked) {
      logger.warn(`[FOLLOW SERVICE] Blocked follow attempt between ${requesterId} and ${targetUserId}`);
      throw new ForbiddenError("You cannot follow this user");
    }

    const existingFollow = await followRepo.findFollow(requesterId, targetUserId);
    if (existingFollow?.status === "ACCEPTED" || existingFollow?.status === "PENDING") {
      return existingFollow;
    }

    const status: FollowStatus = targetUser.isPrivate ? "PENDING" : "ACCEPTED";
    return followRepo.createFollow({ requesterId, targetUserId, status });
  },

  confirmFollowRequest: async (requesterId: string, targetUserId: string): Promise<FollowUserDTO> => {
    if (requesterId === targetUserId) throw new BadRequestError("You cannot follow yourself");

    const followRecord = await followRepo.findFollow(requesterId, targetUserId);
    if (!followRecord || followRecord.status !== "PENDING") {
      throw new NotFoundError("Follow request");
    }

    return followRepo.updateFollow({
      requesterId,
      targetUserId,
      status: "ACCEPTED",
    });
  },

  rejectFollowRequest: async (requesterId: string, targetUserId: string): Promise<FollowUserDTO> => {
    if (requesterId === targetUserId) throw new BadRequestError("You cannot follow yourself");

    const followRecord = await followRepo.findFollow(requesterId, targetUserId);
    if (!followRecord || followRecord.status !== "PENDING") {
      throw new NotFoundError("Follow request");
    }

    return followRepo.updateFollow({
      requesterId,
      targetUserId,
      status: "REJECTED",
    });
  },

  unfollowUser: async (requesterId: string, targetUserId: string) => {
    return followRepo.deleteFollow(requesterId, targetUserId);
  },
});

export type FollowService = ReturnType<typeof createFollowService>;
export const followService = createFollowService();
