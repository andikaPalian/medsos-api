import { Router } from "express";
import * as messageController from "./message.controller.js";
import { userAuth } from "../../../middlewares/authMiddleware.js";
import { validate } from "../../../middlewares/validator.js";
import {
  getMessageSchema,
  messageIdParamSchema,
  sendMessageSchema,
  updateMessageSchema,
} from "./message.validation.js";

const messageRouter = Router();

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
