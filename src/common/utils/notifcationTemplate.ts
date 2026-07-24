export type NotificationType =
  | "FOLLOW"
  | "FOLLOW_REQUEST"
  | "REQUEST_ACCEPTED"
  | "LIKE"
  | "COMMENT"
  | "MENTION"
  | "MESSAGE"
  | "STORY_VIEW"
  | "REQUEST_REJECTED";

const MESSAGE_TEMPLATES: Record<NotificationType, string> = {
  FOLLOW: "started following you.",
  FOLLOW_REQUEST: "sent you a follow request.",
  REQUEST_ACCEPTED: "accepted your follow request.",
  LIKE: "liked your post.",
  COMMENT: "commented on your post.",
  MENTION: "mentioned you in a post.",
  MESSAGE: "sent you a message.",
  STORY_VIEW: "viewed your story.",
  REQUEST_REJECTED: "rejected your follow request.",
};

export const notificationTemplate = (
  notificationType: NotificationType,
  senderName: string,
): string => {
  const templates = MESSAGE_TEMPLATES[notificationType];
  return templates ? `${senderName} ${templates}` : "New notification received";
};
