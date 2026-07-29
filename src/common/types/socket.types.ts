import { Server, Socket } from "socket.io";
import { Request } from "express";
import { NotificationResponseDTO } from "../../modules/notification/dto/notification-response.dto.js";
import { MessageWithSenderAndAttachment } from "../../modules/message/repositories/message.repository.js";

export interface ServerToClientEvents {
  "message:new": (payload: MessageWithSenderAndAttachment) => void;
  "message:read": (payload: { messageId: string; readBy: string }) => void;
  "typing:start": (payload: { userId: string; roomId: string }) => void;
  "typing:stop": (payload: { userId: string; roomId: string }) => void;
  "notification:new": (payload: NotificationResponseDTO) => void;
  "presence:online": (payload: { userId: string }) => void;
  "presence:offline": (payload: { userId: string }) => void;
  error: (payload: { message: string; statusCode?: number }) => void;
}

export interface ClientToServerEvents {
  "room:join": (payload: { roomId: string }) => void;
  "typing:start": (payload: { roomId: string }) => void;
  "typing:stop": (payload: { roomId: string }) => void;
  "message:markRead": (payload: { messageId: string }) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  userId: string;
  username: string;
}

export type AppServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export const getIO = (req: Request): AppServer => req.app.get("io") as AppServer;
