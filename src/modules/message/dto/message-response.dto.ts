import { MessageType, Prisma } from "@prisma/client";

export type MessageWithSenderAndAttachments = Prisma.MessageGetPayload<{
  include: {
    sender: {
      select: {
        id: true;
        profilePic: true;
        username: true;
      };
    };
    attachments: true;
  };
}>;

export interface MessageResponse {
  id: string;
  type: MessageType;
  content: string | null;
  createdAt: Date;
  updatedAt: Date;
  senderId: string;
  receiverId: string;
  sender: {
    id: string;
    profilePic: string | null;
    username: string;
  };
  receiver: {
    id: string;
    profilePic: string | null;
    username: string;
  };
  isRead: boolean;
  isEdited: boolean;
  isDeletedFromEveryone: boolean;
  replyToId: string | null;
  forwardFromId: string | null;
  attachments: MessageAttachmentSummaryDTO[];
}

// export type MessageResponse = Prisma.MessageGetPayload<{
//   include: {
//     sender: {
//       select: {
//         id: true;
//         profilePic: true;
//         username: true;
//       };
//     };
//     receiver: {
//       select: {
//         id: true;
//         profilePic: true;
//         username: true;
//       };
//     };
//     attachments: {
//       select: {
//         id: true;
//         fileName: true;
//         fileSize: true;
//         mimeType: true;
//         duration: true;
//       };
//     };
//   };
// }>;

export interface PaginatedMessagesDTO {
  data: MessageResponse[];
  hasNextPage: boolean;
  nextCursor: string | null;
}

export interface AttachmentData {
  fileUrl: string;
  fileIv: string;
  fileAuthTag: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface MessageAttachmentSummaryDTO {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  duration: number | null;
}

export interface DecryptedAttachmentDTO {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}
