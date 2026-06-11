export interface InsertMessageInput {
  senderId: string;
  receiverId: string;
  content: string;
  iv: string;
  replyToId?: string | null;
  forwardFromId?: string | null;
  chatRoomId: string;
}

export interface GetMessageQueryArgs {
  roomId: string;
  userId: string;
  take: number;
  nextCursor: string | null;
}
