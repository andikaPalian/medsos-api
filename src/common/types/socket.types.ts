export interface SocketUserData {
  userId: string;
  username: string;
}

export interface ClientToServerEvents {
  "chat:join_room": (data: { roomId: string }) => void;
  "chat:leave_room": (data: { roomId: string }) => void;
  "chat:typing": (data: { roomId: string; isTyping: boolean }) => void;
  "chat:mark_read": (data: { roomId: string; messageId: string }) => void;
}

export interface ServerToClientEvents {
  "chat:new_message": (message: string) => void;
  "chat:user_typing": (data: { userId: string; isTyping: boolean }) => void;
  "chat:message_read": (data: { roomId: string; messageId: string }) => void;
  "notification:new": (notificationId: string) => void;
  "presence:update": (data: { userId: string; status: "ONLINE" | "OFFLINE" }) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  user: SocketUserData;
}
