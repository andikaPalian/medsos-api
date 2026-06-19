import { Message } from "@prisma/client";

export interface CreateMessageArgs {
  senderId: string;
  receiverId: string;
  message: string;
  replyToId?: string | null;
  forwardFromId?: string | null;
}

export interface PaginatedMessageResponse {
  success: boolean;
  data: Array<Message & { content: string }>;
  pagination: {
    hasNextPage: boolean;
    nextCursor: string | null;
  };
}
