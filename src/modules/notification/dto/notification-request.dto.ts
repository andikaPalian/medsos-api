import { NotificationType } from "@prisma/client";

export interface NotifyTargetArgs {
  targetUserId: string;
  senderId: string;
  senderUsername: string;
  postId: string | null;
  storyId: string | null;
  type: NotificationType;
}
