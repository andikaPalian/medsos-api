import { createMessage, deleteMessageForEveryone, deleteMessageForHimself, editMessageContent, getMessagesByRoom } from "./messages.service";

export const createMessageController = (io) => async (req, res, next) => {
    try {
        const senderId = req.user.userId;
        const {receiverId} = req.params;
        const {message, replyToId, forwardFromId} = req.body;

        const newMessage = await createMessage({senderId, receiverId, message, replyToId, forwardFromId});

        if (io) {
            io.to(receiverId.toString()).emit('newMessage', newMessage);
        }

        return res.status(201).json({
            success: true,
            message: "Message created successfully",
            data: newMessage
        });
    } catch (error) {
        next(error);
    }
};

export const getMessagesByRoomController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {roomId} = req.params;

        const messages = await getMessagesByRoom(userId, roomId);

        return res.status(200).json({
            success: true,
            message: "Messages fetched successfully",
            data: messages
        });
    } catch (error) {
        next(error);
    }
};

export const editMessageContentController = (io) => async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {messageId} = req.params;
        const {newContent} = req.body;

        const editedMessage = await editMessageContent(userId, messageId, newContent);

        if (io) {
            io.to(editedMessage.receiverId.toString()).emit('messageEdited', editedMessage);
        }

        return res.status(200).json({
            success: true,
            message: "Message edited successfully",
            data: editedMessage
        });
    } catch (error) {
        next(error);
    }
};

export const deleteMessageForHimselfController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {messageId} = req.params;

        await deleteMessageForHimself(userId, messageId);

        return res.status(200).json({
            success: true,
            message: "Message deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const deleteMessageForEveryoneController = (io) => async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {messageId} = req.params;

        await deleteMessageForEveryone(userId, messageId);

        if (io) {
            io.emit('messageDeleted', {messageId});
        }

        return res.status(200).json({
            success: true,
            message: "Message deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};