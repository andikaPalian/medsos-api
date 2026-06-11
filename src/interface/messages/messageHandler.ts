import { Socket } from "socket.io";

export interface AuthenticateSocket extends Socket {
  user?: {
    id: string;
    username: string;
  };
}

export interface SendMessagePayload {
  receiverId: string;
  message: string;
  replyToId?: string | null;
  forwardFromId?: string | null;
}

export interface EditMessagePayload {
  messageId: string;
  newMessage: string;
}

export interface DeleteMessagePayload {
  messageId: string;
}
