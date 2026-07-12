import * as userRepository from "../../user/repositories/user.repository.js";
import * as followRepository from "../repositories/follow.repository.js";
import * as blockRepository from "../../block/repositories/block.repository.js";
import { FollowUserDTO, PaginatedFollowersDTO, UserFollowDTO } from "../dto/follow-response.dto.js";
import { AppError } from "../../../common/error/errorHandler.js";
import { logger } from "../../../common/utils/logger.js";
import { FollowDirection, FollowDTO } from "../dto/follow-request.dto.js";
import { paginateCursor } from "../../../common/utils/pagination.js";
import { FollowStatus } from "@prisma/client";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export const listFollowRelations = async (
  direction: FollowDirection,
  { requesterId, targetUserId, cursor, limit }: FollowDTO,
): Promise<PaginatedFollowersDTO> => {
  const take = Math.min(MAX_LIMIT, Math.max(1, limit ?? DEFAULT_LIMIT));

  const targetUser = await userRepository.findUserById(targetUserId);
  if (!targetUser) throw new AppError("User not found", 404);

  if (requesterId !== targetUserId && targetUser.isPrivate) {
    const followRecord = await followRepository.findFollow(requesterId, targetUserId);
    if (!followRecord || followRecord.status !== "ACCEPTED") {
      logger.warn(
        `[FOLLOW SERVICE] Blocked acccess to private profile: ${targetUserId} by ${requesterId}`,
      );
      throw new AppError("This account is private", 403);
    }
  }

  const rawResult =
    direction === "FOLLOWERS"
      ? await followRepository.followersList({ userId: targetUserId, take: take + 1, cursor })
      : await followRepository.followingList({ userId: targetUserId, take: take + 1, cursor });

  const { items, nextCursor, hasNextPage } = paginateCursor(rawResult, take, (f) => f.id);

  const data: UserFollowDTO[] = items.map((item) => ({
    id: item.user.id,
    username: item.user.username,
    profilePic: item.user.profilePic,
  }));

  return {
    data,
    nextCursor,
    hasNextPage,
  };
};

export const listFollowRequests = async ({
  requesterId,
  targetUserId,
  cursor,
  limit,
}: FollowDTO): Promise<PaginatedFollowersDTO> => {
  const take = Math.min(MAX_LIMIT, Math.max(1, limit ?? DEFAULT_LIMIT));

  const rawResult = await followRepository.findFollowRequest({
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

  return {
    data,
    nextCursor,
    hasNextPage,
  };
};

export const followUser = async (
  requesterId: string,
  targetUserId: string,
): Promise<FollowUserDTO> => {
  if (requesterId === targetUserId) throw new AppError("You cannot follow yourself", 400);

  const targetUser = await userRepository.findUserById(targetUserId);
  if (!targetUser) throw new AppError("User not found", 404);

  const isBlocked = await blockRepository.isBlockedEitherWay(requesterId, targetUserId);
  if (isBlocked) {
    logger.warn(
      `[FOLLOW SERVICE] Blocked follow attempt between ${requesterId} and ${targetUserId}`,
    );
    throw new AppError("You cannot follow this user", 403);
  }

  const existingFollow = await followRepository.findFollow(requesterId, targetUserId);
  if (existingFollow?.status === "ACCEPTED" || existingFollow?.status === "PENDING") {
    return existingFollow;
  }

  const status: FollowStatus = targetUser.isPrivate ? "PENDING" : "ACCEPTED";

  return await followRepository.createFollow({ requesterId, targetUserId, status });
};

export const confirmFollowRequest = async (
  requesterId: string,
  targetUserId: string,
): Promise<FollowUserDTO> => {
  if (requesterId === targetUserId) throw new AppError("You cannot follow yourself", 400);

  const followRecord = await followRepository.findFollow(requesterId, targetUserId);
  if (!followRecord || followRecord.status !== "PENDING") {
    throw new AppError("Follow request not found", 404);
  }

  return await followRepository.updateFollow({
    requesterId,
    targetUserId,
    status: "ACCEPTED",
  });
};

export const rejectFollowRequest = async (
  requesterId: string,
  targetUserId: string,
): Promise<FollowUserDTO> => {
  if (requesterId === targetUserId) throw new AppError("You cannot follow yourself", 400);

  const followRecord = await followRepository.findFollow(requesterId, targetUserId);
  if (!followRecord || followRecord.status !== "PENDING") {
    throw new AppError("Follow request not found", 404);
  }

  return await followRepository.updateFollow({
    requesterId,
    targetUserId,
    status: "REJECTED",
  });
};

export const unfollowUser = async (requesterId: string, targetUserId: string) => {
  return await followRepository.deleteFollow(requesterId, targetUserId);
};
