import { commentOnPost, createPost, deleteComment, deletePost, getCommentsByPost, getFeed, getPostById, getSavedPosts, likesToggle, replyToComment, reportPost, savePostToggle, updatePost } from "./post.service.js";

export const createPostController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        
        const post = await createPost(userId, req.body, req.files);

        return res.status(201).json({
            success: true,
            message: "Post created successfully",
            data: post
        });
    } catch (error) {
        next(error);
    }
};

export const getPostByIdController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {postId} = req.params;

        const post = await getPostById(userId, postId);

        return res.status(200).json({
            success: true,
            message: "Post fetched successfully",
            data: post
        });
    } catch (error) {
        next(error);
    }
};

export const deletePostController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {postId} = req.params;

        await deletePost(userId, postId);

        return res.status(200).json({
            success: true,
            message: "Post deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const getFeedController = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const feed = await getFeed(userId, req.query);

        return res.status(200).json({
            success: true,
            message: "Feed fetched successfully",
            data: feed
        });
    } catch (error) {
        next(error);
    }
};

export const updatePostController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {postId} = req.params;

        await updatePost(userId, postId, req.body, req.files);

        return res.status(200).json({
            success: true,
            message: "Post updated successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const likesToggleController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {postId} = req.params;

        await likesToggle(userId, postId);

        return res.status(200).json({
            success: true,
            message: "Post like toggled successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const commentOnPostController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {postId} = req.params;

        const comment = await commentOnPost(userId, postId, req.body);

        return res.status(201).json({
            success: true,
            message: "Comment added successfully",
            data: comment
        });
    } catch (error) {
        next(error);
    }
};

export const replyCommentController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {postId, commentId} = req.params;

        const reply = await replyToComment(userId, postId, commentId, req.body);

        return res.status(201).json({
            success: true,
            message: "Reply comment successfully",
            data: reply
        });
    } catch (error) {
        next(error);
    }
};

export const getCommentsByPostController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {postId} = req.params;

        const comments = await getCommentsByPost(userId, postId, req.query);

        return res.status(200).json({
            success: true,
            message: "Comments fetched successfully",
            data: comments
        });
    } catch (error) {
        next(error);
    }
};

export const deleteCommentController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {postId, commentId} = req.params;

        await deleteComment(userId, postId, commentId);

        return res.status(200).json({
            success: true,
            message: "Comment deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const savePostToggleController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {postId} = req.params;

        await savePostToggle(userId, postId);

        return res.status(200).json({
            success: true,
            message: "Post save toggled successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const getSavedPostsController = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const savedPosts = await getSavedPosts(userId, req.query);

        return res.status(200).json({
            success: true,
            message: "Saved posts fetched successfully",
            data: savedPosts
        });
    } catch (error) {
        next(error);
    }
};

export const reportPostController = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const {postId} = req.params;
        
        await reportPost(userId, postId, req.body);

        return res.status(200).json({
            success: true,
            message: "Post reported successfully"
        });
    } catch (error) {
        next(error);
    }
};