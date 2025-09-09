import { getUserProfile, listCloseFriends, listFollowers, listFollowing, togglePrivateAccount, updateCloseFriends, updateProfile } from "./user.service.js";

export const updateProfileController = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const updatedProfile = await updateProfile(userId, req.file, req.body);

        return res.status(200).json({
            success: true,
            message: "User profile updated successfully",
            data: updatedProfile
        });
    } catch (error) {
        next(error);
    }
};

export const getUserProfileController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {targetUserId} = req.params;

        const userProfile = await getUserProfile(userId, targetUserId);

        return res.status(200).json({
            success: true,
            message: "User profile fetched successfully",
            data: userProfile
        });
    } catch (error) {
        next(error);
    }
};

export const togglePrivateAccountController = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        await togglePrivateAccount(userId);

        return res.status(200).json({
            success: true,
            message: "User privacy settings updated successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const listFollowersController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {targetUserId} = req.params;

        const followers = await listFollowers(userId, targetUserId);

        return res.status(200).json({
            success: true,
            message: "Followers fetched successfully",
            data: followers
        });
    } catch (error) {
        next(error);
    }
};

export const listFollowingController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {targetUserId} = req.params;

        const following = await listFollowing(userId, targetUserId);

        return res.status(200).json({
            success: true,
            message: "Following fetched successfully",
            data: following
        });
    } catch (error) {
        next(error);
    }
};

export const updateCloseFriendsController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {targetUserId} = req.params;

        await updateCloseFriends(userId, targetUserId);
        
        return res.status(200).json({
            success: true,
            message: "Close friends updated successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const listCloseFriendsController = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const closeFriends = await listCloseFriends(userId);

        return res.status(200).json({
            success: true,
            message: "Close friends fetched successfully",
            data: closeFriends
        });
    } catch (error) {
        next(error);
    }
};