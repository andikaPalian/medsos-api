import { z } from "zod";

// Validation schema for create or send message
export const sendMessageSchema = z.object({
  body: z.object({
    receiverId: z.string().trim().uuid({ message: "Receiver ID format is not valid." }),
    message: z.string().trim().min(1, "Message content is required").max(5000, "Message too long"),
    replyToId: z
      .string()
      .trim()
      .uuid({ message: "Reply To ID format is not valid." })
      .nullable()
      .optional(),
    forwardFromId: z
      .string()
      .trim()
      .uuid({ message: "Forward From ID format is not valid." })
      .nullable()
      .optional(),
  }),
});

// Validation schema for get message
export const getMessageSchema = z.object({
  params: z.object({
    roomId: z.string().trim().min(1, "Room ID is required."),
  }),
  query: z.object({
    limit: z.coerce
      .number()
      .positive("Limit must be a positive number")
      .max(100, "Max limit is 100")
      .default(30),
    nextCursor: z.string().trim().uuid({ message: "Cursor must be a valid UUID." }),
  }),
});

// Validation schema for update/edit message
export const updateMessageSchema = z.object({
  params: z.object({
    messageId: z.string().trim().uuid({ message: "Message ID format is not valid." }),
  }),
  body: z.object({
    newMessage: z
      .string()
      .trim()
      .min(1, "Message content is required")
      .max(5000, "Message too long"),
  }),
});

// Validation schema for message paramater
export const messageIdParamSchema = z.object({
  params: z.object({
    messageId: z.string().trim().uuid({ message: "Message ID format is not valid." }),
  }),
});

export const attachmentIdParamSchema = z.object({
  params: z.object({
    attachmentId: z.string().trim().uuid({ message: "Attachment ID format is not valid." }),
  }),
});

export type GetMessagesParams = z.infer<typeof getMessageSchema>["params"];
export type GetMessagesQuery = z.infer<typeof getMessageSchema>["query"];
