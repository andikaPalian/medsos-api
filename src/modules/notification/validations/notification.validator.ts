import { z } from "zod";
import { cursorPaginationQuerySchema } from "../../../common/validation/pagination.validation.js";

export const getNotificationsSchema = z.object({
  query: cursorPaginationQuerySchema,
});

export const notificationActionSchema = z.object({
  params: z.object({
    notificationId: z.string().trim().uuid({ message: "Invalid notification ID format." }),
  }),
});

export type GetNotificationsQuery = z.infer<typeof getNotificationsSchema>["query"];

export type NotificationActionParams = z.infer<typeof notificationActionSchema>["params"];
