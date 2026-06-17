import { Prisma } from "@prisma/client";

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

// export const safeUserSelect = {
//   id: true,
//   profilePic: true,
//   username: true,
// } satisfies Prisma.UserSelect;

export type MessageWithSender = Prisma.MessageGetPayload<{
  include: {
    sender: {
      select: {
        id: true;
        profilePic: true;
        username: true;
      };
    };
  };
}>;

export type MessageWithParticipants = Prisma.MessageGetPayload<{
  include: {
    sender: {
      select: {
        id: true;
        profilePic: true;
        username: true;
      };
    };
    receiver: {
      select: {
        id: true;
        profilePic: true;
        username: true;
      };
    };
  };
}>;
