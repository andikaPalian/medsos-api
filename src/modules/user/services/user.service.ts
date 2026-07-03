import { AppError } from "../../../common/error/errorHandler.js";
import { logger } from "../../../common/utils/logger.js";
import { UpdateUserDataDTO, UserUpdateData } from "../dto/user-request.dto.js";
import * as userRepository from "../repositories/user.repository.js";
import * as followRepository from "../../follow/repositories/follow.repository.js";
import { cloudinary } from "../../../config/cloudinary.js";
import fs from "fs/promises";
import {
  GetUserProfileResultDTO,
  PostSummaryDTO,
  UserProfileDTO,
} from "../dto/user-response.dto.js";
import { DuplicateEntryError } from "../../../common/error/domain.error.js";
import { User } from "@prisma/client";

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
// Helper function to clean up temporary files
const cleanUpTempFile = async (filePath: string): Promise<void> => {
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
  } catch (error) {
    logger.error(`[USER SERVICE] Failed to delete temporary file: ${filePath}. Error: ${error}`);
  }
};

// Helper function to upload profile picture to Cloudinary
const uploadProfilePicture = async (
  file: Express.Multer.File,
  oldPublicId?: string | null,
): Promise<{ profilePic: string; profilePublicId: string }> => {
  let uploadResult;
  try {
    uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: "profile-pictures",
      resource_type: "image",
      use_filename: false,
      unique_filename: true,
      overwrite: true,
    });
  } finally {
    await cleanUpTempFile(file.path);
  }

  if (oldPublicId) {
    try {
      await cloudinary.uploader.destroy(oldPublicId);
    } catch (error) {
      logger.warn(`[USER SERVICE] Failed to delete old profile picture ${oldPublicId}`);
    }
  }

  return {
    profilePic: uploadResult.secure_url,
    profilePublicId: uploadResult.public_id,
  };
};

export const updateProfile = async (
  userId: string,
  data: UpdateUserDataDTO,
): Promise<UserProfileDTO> => {
  const user = await userRepository.findUserById(userId);
  if (!user) throw new AppError("User not found", 404);

  const updateData: UserUpdateData = {};

  if (data.username !== undefined) updateData.username = data.username;
  if (data.fullName !== undefined) updateData.fullName = data.fullName;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.isPrivate !== undefined) updateData.isPrivate = data.isPrivate;

  if (data.profilePic) {
    const { profilePic, profilePublicId } = await uploadProfilePicture(
      data.profilePic,
      user.profilePublicId,
    );
    updateData.profilePic = profilePic;
    updateData.profilePublicId = profilePublicId;
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
