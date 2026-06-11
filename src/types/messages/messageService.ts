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
    hashNextPage: boolean;
    nextCursor: string | null;
  };
}
