export interface NotificationSenderDTO {
  id: string;
  username: string;
  profilePic: string | null;
}

export interface NotificationResponseDTO {
  id: string;
  userId: string;
  sender: NotificationSenderDTO | null;
  senderId: string | null;
  type: string;
  message: string;
  isRead: boolean;
  postId: string | null;
  storyId: string | null;
  createdAt: Date;
}

export interface PaginatedNotificationDTO {
  data: NotificationResponseDTO[];
  nextCursor: string | null;
  hasNextPage: boolean;
}
