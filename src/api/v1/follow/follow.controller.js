import { acceptRequest, getMutualFollowers, listRequests, rejectRequest, suggestedUsers, toggleFollow } from "./follow.service.js";

export const toggleFollowController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {targetUserId} = req.params;

        await toggleFollow(userId, targetUserId);

        return res.status(200).json({
            success: true,
            message: "Follow toggle successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const listRequestsController = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const requests = await listRequests(userId);

        return res.status(200).json({
            success: true,
            message: "Requests fetched successfully",
            data: requests
        });
    } catch (error) {
        next(error);
    }
};

export const acceptRequestController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {followerId} = req.params;

        await acceptRequest(userId, followerId);

        return res.status(200).json({
            success: true,
            message: "Request accepted successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const rejectRequestController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {followerId} = req.params;

        await rejectRequest(userId, followerId);

        return res.status(200).json({
            success: true,
            message: "Request rejected successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const getMutualFollowersController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {targetUserId} = req.params;

        const mutualUsers = await getMutualFollowers(userId, targetUserId);

        return res.status(200).json({
            success: true,
            message: "Mutual followers fetched successfully",
            data: mutualUsers
        });
    } catch (error) {
        next(error);
    }
};

export const suggestedUsersController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        
        const suggestions = await suggestedUsers(userId, req.query);

        return res.status(200).json({
            success: true,
            message: "Suggested users fetched successfully",
            data: suggestions
        });
    } catch (error) {
        next(error);
    }
};