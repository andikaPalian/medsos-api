import { NotFoundError, ForbiddenError, ConflictError, DuplicateEntryError } from "@core/errors/index.js";
import { logger } from "@core/utils/logger.js";
import { UpdateUserDataDTO, UserUpdateData } from "./dto/user-request.dto.js";
import { userRepository as defaultUserRepo } from "./user.repository.js";
import { followRepository as defaultFollowRepo } from "@modules/follow/follow.repository.js";
import { blockRepository as defaultBlockRepo } from "@modules/block/block.repository.js";
import { deleteFromCloudinary } from "@core/utils/cloudinary.util.js";
import {
  GetUserProfileResultDTO,
  PostSummaryDTO,
  UserProfileDTO,
} from "./dto/user-response.dto.js";
import { User } from "@prisma/client";

export interface UploadedPictureDTO {
  url: string;
  publicId: string;
}

const sanitizeUser = (user: User): UserProfileDTO => ({
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
});

export const createUserService = (
  userRepo = defaultUserRepo,
  followRepo = defaultFollowRepo,
  blockRepo = defaultBlockRepo,
) => ({
  updateProfile: async (
    userId: string,
    data: UpdateUserDataDTO,
    uploadMedia?: UploadedPictureDTO,
  ): Promise<UserProfileDTO> => {
    const user = await userRepo.findUserById(userId);
    if (!user) throw new NotFoundError("User");

    const updateData: UserUpdateData = {};

    if (data.username !== undefined) updateData.username = data.username;
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.isPrivate !== undefined) updateData.isPrivate = data.isPrivate;

    if (uploadMedia) {
      updateData.profilePic = uploadMedia.url;
      updateData.profilePublicId = uploadMedia.publicId;

      if (user.profilePublicId) {
        deleteFromCloudinary(user.profilePublicId, "image");
      }
    }

    if (Object.keys(updateData).length === 0) {
      logger.info(`[USER SERVICE] No changes detected for user: ${userId}`);
      return sanitizeUser(user);
    }

    try {
      const updatedUser = await userRepo.updateUserById(userId, updateData);
      return sanitizeUser(updatedUser);
    } catch (error) {
      if (error instanceof DuplicateEntryError) {
        throw new ConflictError("Username already exists", "username");
      }
      throw error;
    }
  },

  getUserProfile: async (
    requesterId: string,
    targetUserId: string,
  ): Promise<GetUserProfileResultDTO> => {
    const targetUser = await userRepo.findUserProfileById(targetUserId);
    if (!targetUser) throw new NotFoundError("User");

    const isOwnProfile = requesterId === targetUserId;
    let isFollowing = false;

    if (!isOwnProfile) {
      const isBlocked = await blockRepo.isBlockedEitherWay(requesterId, targetUserId);
      if (isBlocked) {
        logger.warn(`[USER SERVICE] Blocked profile attempt between ${requesterId} and ${targetUserId}`);
        throw new ForbiddenError("You cannot view this profile");
      }

      const followRecord = await followRepo.findFollow(requesterId, targetUserId);
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
      logger.info(`[USER SERVICE] Private profile accessed: ${targetUserId} by ${requesterId}`);
      return {
        ...baseProfile,
        posts: "This profile is private",
      };
    }

    const mappedPosts: PostSummaryDTO[] = targetUser.posts.map((post) => ({
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

    return {
      ...baseProfile,
      posts: mappedPosts,
    };
  },
});

export type UserService = ReturnType<typeof createUserService>;
export const userService = createUserService();
