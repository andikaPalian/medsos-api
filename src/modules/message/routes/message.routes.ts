import { Router } from "express";
import * as messageController from "../controllers/message.controller.js";
import * as messageValidator from "../validators/message.validation.js";
import { userAuth } from "../../../middlewares/auth.middleware.js";
import { validate } from "../../../middlewares/validator.js";

export const messageRouter = Router();

messageRouter.use(userAuth);

messageRouter.post(
  "/",
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
