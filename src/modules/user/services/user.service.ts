import { AppError } from "../../../common/error/errorHandler.js";
import { logger } from "../../../common/utils/logger.js";
import { UpdateUserDataDTO, UserUpdateData } from "../dto/user-request.dto.js";
import * as userRepository from "../repositories/user.repository.js";
import * as followRepository from "../../follow/repositories/follow.repository.js";
import * as mediaService from "../../media/services/media.service.js";
import {
  GetUserProfileResultDTO,
  PostSummaryDTO,
  UserProfileDTO,
} from "../dto/user-response.dto.js";
import { DuplicateEntryError } from "../../../common/error/domain.error.js";
import { User } from "@prisma/client";
import { UploadMediaDTO } from "../../media/dto/media-response.dto.js";

const sanitizeUser = (user: User): UserProfileDTO => {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    bio: user.bio,
    profilePic: user.profilePic,
    isPrivate: user.isPrivate,
    isVerified: user.isVerified,
    followersCount: user.followersCount,
    followingCount: user.followingCount,
    totalPosts: 0,
    isFollowing: false,
    isOwnProfile: false,
  };
};

const mapPost = (posts: userRepository.UserProfileResult["posts"]): PostSummaryDTO[] => {
  return posts.map((post) => ({
    id: post.id,
    caption: post.caption,
    totalLikes: post.totalLikes,
    createdAt: post.createdAt,
    media: post.media.map((m) => ({
      id: m.id,
      url: m.url,
      type: m.type,
    })),
  }));
};

export const updateProfile = async (
  userId: string,
  data: UpdateUserDataDTO,
  uploadMedia?: UploadMediaDTO,
): Promise<UserProfileDTO> => {
  const user = await userRepository.findUserById(userId);
  if (!user) throw new AppError("User not found", 404);

  const updateData: UserUpdateData = {};

  if (data.username !== undefined) updateData.username = data.username;
  if (data.fullName !== undefined) updateData.fullName = data.fullName;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.isPrivate !== undefined) updateData.isPrivate = data.isPrivate;

  if (uploadMedia) {
    updateData.profilePic = uploadMedia.url;
    updateData.profilePublicId = uploadMedia.publicId;

    if (user.profilePublicId) {
      mediaService.deleteAssets(user.profilePublicId);
    }
  }

  if (Object.keys(updateData).length === 0) {
    logger.info(`[USER SERVICE] No changes detected for user: ${userId}`);
    return sanitizeUser(user);
  }

  try {
    const updatedUser = await userRepository.updateUserById(userId, updateData);
    return sanitizeUser(updatedUser);
  } catch (error) {
    if (error instanceof DuplicateEntryError) {
      throw new AppError("Username already exists", 409);
    }
    throw error;
  }
};

export const getUserProfile = async (
  requesterId: string,
  targetUserId: string,
): Promise<GetUserProfileResultDTO> => {
  const targetUser = await userRepository.findUserProfileById(targetUserId);
  if (!targetUser) throw new AppError("User not found", 404);

  const isOwnProfile = requesterId === targetUserId;

  let isFollowing = false;
  if (!isOwnProfile) {
    const followRecord = await followRepository.findFollow(requesterId, targetUserId);
    isFollowing = followRecord?.status === "ACCEPTED";
  }

  const baseProfile: UserProfileDTO = {
    id: targetUser.id,
    username: targetUser.username,
    fullName: targetUser.fullName,
    bio: targetUser.bio,
    profilePic: targetUser.profilePic,
    isPrivate: targetUser.isPrivate,
    isVerified: targetUser.isVerified,
    followersCount: targetUser.followersCount,
    followingCount: targetUser.followingCount,
    totalPosts: targetUser._count.posts,
    isFollowing,
    isOwnProfile,
  };

  if (targetUser.isPrivate && !isFollowing && !isOwnProfile) {
    logger.info(`[USER SERVICE] Private profile: ${targetUserId} by ${requesterId}`);
    return {
      ...baseProfile,
      posts: "This profile is private",
    };
  }

  return {
    ...baseProfile,
    posts: mapPost(targetUser.posts),
  };
};
