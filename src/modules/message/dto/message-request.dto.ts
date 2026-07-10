export interface CreateMessageDTO {
  senderId: string;
  receiverId: string;
  message?: string;
  replyToId?: string | null;
  forwardFromId?: string | null;
  uploadFile?: Express.Multer.File;
}

export interface GetMessagesDTO {
  userId: string;
  roomId: string;
  cursor: string | null;
  limit?: number;
}
