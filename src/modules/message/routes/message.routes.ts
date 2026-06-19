import { Router } from "express";
import * as messageController from "../controllers/message.controller.js";
import { userAuth } from "../../../middlewares/auth.middleware.js";
import { validate } from "../../../middlewares/validator.js";
import {
  getMessageSchema,
  messageIdParamSchema,
  sendMessageSchema,
  updateMessageSchema,
} from "../validators/message.validation.js";

export const messageRouter = Router();

messageRouter.use(userAuth);

messageRouter.post("/", validate(sendMessageSchema), messageController.sendMessage);
messageRouter.get("/room/:roomId", validate(getMessageSchema), messageController.getMessages);
messageRouter.patch("/:messageId", validate(updateMessageSchema), messageController.updateMessage);
messageRouter.delete(
  "/:messageId/me",
  validate(messageIdParamSchema),
  messageController.purgeMessageForMe,
);
messageRouter.delete(
  "/:messageId/everyone",
  validate(messageIdParamSchema),
  messageController.recallMessageForEveryone,
);
