import express from "express";
import { userAuth } from "../../../middlewares/userMiddleware";
import { createMessageController, deleteMessageForEveryoneController, deleteMessageForHimselfController, editMessageContentController, getMessagesByRoomController } from "./message.controller";

const messageRouter = express.Router();

export default (io) => {
    messageRouter.post("/:receiverId", userAuth, createMessageController(io));
    messageRouter.get("/:roomId", userAuth, getMessagesByRoomController);
    messageRouter.put("/:messageId", userAuth, editMessageContentController(io));
    messageRouter.delete("/self/:messageId", userAuth, deleteMessageForHimselfController);
    messageRouter.delete("/everyone/:messageId", userAuth, deleteMessageForEveryoneController(io));

    return messageRouter;
}