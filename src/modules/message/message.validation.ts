import { z } from "zod";

const cursorPaginationQuerySchema = z.object({
  limit: z.coerce.number().positive().optional(),
  cursor: z.string().trim().optional(),
});

export const sendMessageSchema = z.object({
  body: z.object({
    receiverId: z.string().trim().uuid("Receiver ID format is not valid"),
    message: z.string().trim().min(1, "Message content is required").max(5000, "Message too long").optional(),
    replyToId: z.string().trim().uuid("Reply To ID format is not valid").nullable().optional(),
    forwardFromId: z.string().trim().uuid("Forward From ID format is not valid").nullable().optional(),
  }),
});

export const getMessageSchema = z.object({
  params: z.object({
    roomId: z.string().trim().min(1, "Room ID is required"),
  }),
  query: cursorPaginationQuerySchema,
});

export const updateMessageSchema = z.object({
  params: z.object({
    messageId: z.string().trim().uuid("Message ID format is not valid"),
  }),
  body: z.object({
    newMessage: z.string().trim().min(1, "Message content is required").max(5000, "Message too long"),
  }),
});

export const messageIdParamSchema = z.object({
  params: z.object({
    messageId: z.string().trim().uuid("Message ID format is not valid"),
  }),
});

export const attachmentIdParamSchema = z.object({
  params: z.object({
    attachmentId: z.string().trim().uuid("Attachment ID format is not valid"),
  }),
});

export type SendMessageBody = z.infer<typeof sendMessageSchema>["body"];
export type GetMessagesParams = z.infer<typeof getMessageSchema>["params"];
export type GetMessagesQuery = z.infer<typeof getMessageSchema>["query"];
export type UpdateMessageParams = z.infer<typeof updateMessageSchema>["params"];
export type UpdateMessageBody = z.infer<typeof updateMessageSchema>["body"];
export type MessageIdParam = z.infer<typeof messageIdParamSchema>["params"];
export type AttachmentIdParam = z.infer<typeof attachmentIdParamSchema>["params"];
