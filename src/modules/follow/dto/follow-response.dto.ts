import { FollowStatus } from "@prisma/client";

export interface UserFollowDTO {
  id: string;
  username: string;
  profilePic: string | null;
}

export interface PaginatedFollowersDTO {
  data: UserFollowDTO[];
  hasNextPage: boolean;
  nextCursor: string | null;
}

export interface FollowUserDTO {
  id: string;
  followerId: string;
  followingId: string;
  status: FollowStatus;
}
