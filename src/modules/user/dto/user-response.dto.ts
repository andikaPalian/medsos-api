import { MediaType } from "@prisma/client";

export interface UserProfileDTO {
  id: string;
  username: string;
  fullName: string | null;
  bio: string | null;
  profilePic: string | null;
  isPrivate: boolean;
  isVerified: boolean;
  followersCount: number;
  followingCount: number;
  totalPosts: number;
  isFollowing: boolean;
  isOwnProfile: boolean;
}

export interface MediaDTO {
  id: string;
  url: string;
  type: MediaType;
}

export interface PostSummaryDTO {
  id: string;
  caption: string | null;
  totalLikes: number;
  createdAt: Date;
  media: MediaDTO[];
}

export interface PublicUserProfileDTO extends UserProfileDTO {
  posts: PostSummaryDTO[];
}

export interface PrivateUserProfileDTO extends UserProfileDTO {
  posts: "This profile is private";
}

export type GetUserProfileResultDTO = PublicUserProfileDTO | PrivateUserProfileDTO;
