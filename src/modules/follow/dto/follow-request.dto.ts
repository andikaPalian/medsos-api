export interface FollowDTO {
  requesterId: string;
  targetUserId: string;
  cursor: string | null;
  limit?: number;
}

export type FollowDirection = "FOLLOWERS" | "FOLLOWING";
