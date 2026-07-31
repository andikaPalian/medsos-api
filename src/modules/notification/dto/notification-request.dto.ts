import { NotificationType } from "@prisma/client";
import { AppServer } from "../../../common/types/socket.types.js";

export interface NotifyTargetArgs {
  io: AppServer;
  targetUserId: string;
  senderId: string;
  senderUsername: string;
  postId: string | null;
  storyId: string | null;
  type: NotificationType;
}

export interface GetNotificationsDTO {
  userId: string;
  limit: number;
  cursor: string | null;
}
