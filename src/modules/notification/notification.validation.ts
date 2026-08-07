import { z } from "zod";

const cursorPaginationQuerySchema = z.object({
  limit: z.coerce.number().positive().optional(),
  cursor: z.string().trim().optional(),
});

export const getNotificationsSchema = z.object({
  query: cursorPaginationQuerySchema,
});

export const notificationActionSchema = z.object({
  params: z.object({
    notificationId: z.string().trim().uuid("Invalid notification ID format"),
  }),
});

export type GetNotificationsQuery = z.infer<typeof getNotificationsSchema>["query"];
export type NotificationActionParams = z.infer<typeof notificationActionSchema>["params"];
