import { createStory, deleteStory, getMyStories, getStoriesFeed, getStoryViewers, getUserStories } from "./story.service.js";

export const createStoryController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {isCloseFriends} = req.body;

        const story = await createStory(userId, req.files, isCloseFriends);

        return res.status(200).json({
            success: true,
            message: "Story created successfully",
            data: story
        });
    } catch (error) {
        next(error);
    }
};

export const getUserStoriesController = async (req, res, next) => {
    try {
        const viewerId = req.user.userId;
        const {userId} = req.params;

        const stories = await getUserStories(userId, viewerId);

        return res.status(200).json({
            success: true,
            message: "Stories ferched successfully",
            data: stories
        });
    } catch (error) {
        next(error);
    }
};

export const getStoryViewersController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {storyId} = req.params;

        const viewers = await getStoryViewers(userId, storyId);

        return res.status(200).json({
            success: true,
            message: "Viewers fetched successfully",
            data: viewers
        });
    } catch (error) {
        next(error);
    }
};

export const deleteStoryController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {storyId} = req.params;

        await deleteStory(userId, storyId);
        
        return res.status(200).json({
            success: true,
            message: "Story deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const getMyStoriesController = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const myStories = await getMyStories(userId);

        return res.status(200),json({
            success: true,
            message: "My stories fetched successfully",
            data: myStories
        });
    } catch (error) {
        next(error);
    }
};

export const getStoryFeedController = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const storiesFeed = await getStoriesFeed(userId);

        return res.status(200).json({
            success: true,
            message: "Stories feed fetched successfully",
            data: storiesFeed
        });
    } catch (error) {
        next(error);
    }
};