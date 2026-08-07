import { Router } from "express";
import { messageController } from "./message.controller.js";
import * as messageValidator from "./message.validation.js";
import { userAuth } from "@infra/http/middlewares/auth.middleware.js";
import { validate } from "@infra/http/middlewares/validate.middleware.js";
import { uploadMedia } from "@infra/http/middlewares/upload.middleware.js";

export const messageRouter = Router();

messageRouter.use(userAuth);

messageRouter.post(
  "/",
  uploadMedia.single("attachment"),
  validate(messageValidator.sendMessageSchema),
  messageController.sendMessage,
);

messageRouter.get(
  "/room/:roomId",
  validate(messageValidator.getMessageSchema),
  messageController.getMessages,
);

messageRouter.patch(
  "/:messageId",
  validate(messageValidator.updateMessageSchema),
  messageController.updateMessage,
);

messageRouter.delete(
  "/:messageId/me",
  validate(messageValidator.messageIdParamSchema),
  messageController.purgeMessageForMe,
);

messageRouter.delete(
  "/:messageId/everyone",
  validate(messageValidator.messageIdParamSchema),
  messageController.recallMessageForEveryone,
);

messageRouter.get(
  "/:attachmentId/download",
  validate(messageValidator.attachmentIdParamSchema),
  messageController.downloadAttachment,
);
