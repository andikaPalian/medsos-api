import { Response } from "express";
import * as postService from "../services/post.service.js";
import * as mediaService from "../../media/services/media.service.js";
import { authHandler } from "../../../common/utils/authHandler.js";
import { AuthenticatedRequest } from "../../../common/types/authenticated-request.js";
import {
  CreatePostBody,
  DeletePostParams,
  GetFeedQuery,
  GetPostByIdParams,
  UpdatePostBody,
  UpdatePostParams,
} from "../validations/post.validator.js";
import { CreateMediaInput } from "../dto/post-request.dto.js";

const deriveMediaType = (mimeType: string): "IMAGE" | "VIDEO" => {
  return mimeType.startsWith("video/") ? "VIDEO" : "IMAGE";
};

const uploadPostFile = async (
  files: Express.Multer.File[] | undefined,
): Promise<CreateMediaInput[]> => {
  if (!files || files.length === 0) return [];

  return await Promise.all(
    files.map(async (f) => {
      const uploaded = await mediaService.uploadPostMedia(f);
      return {
        url: uploaded.url,
        urlPublicId: uploaded.publicId,
        type: deriveMediaType(f.mimetype),
      };
    }),
  );
};

export const createPost = authHandler(
  async (
    req: AuthenticatedRequest<any, any, CreatePostBody, any, any>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user.id;
    const { caption } = req.body;
    const files = req.files as Express.Multer.File[];
    const media = await uploadPostFile(files);

    const post = await postService.createPost({ authorId: userId, caption, media });

    res.status(201).json({
      success: true,
      data: post,
    });
  },
);

export const updatePost = authHandler(
  async (
    req: AuthenticatedRequest<UpdatePostParams, any, UpdatePostBody, any, any>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user.id;
    const { postId } = req.params;
    const { caption, tags } = req.body;
    const files = req.files as Express.Multer.File[];
    const media = await uploadPostFile(files);

    const updatedPost = await postService.updatePost({
      userId,
      postId,
      caption,
      tags,
      media,
    });

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: updatedPost,
    });
  },
);

export const deletePost = authHandler(
  async (
    req: AuthenticatedRequest<DeletePostParams, any, any, any, any>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user.id;
    const { postId } = req.params;

    await postService.deletePost(userId, postId);

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
      data: { postId },
    });
  },
);

export const getPostById = authHandler(
  async (
    req: AuthenticatedRequest<GetPostByIdParams, any, any, any, any>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user.id;
    const { postId } = req.params;

    const post = await postService.getPostById(userId, postId);

    res.status(200).json({
      success: true,
      data: post,
    });
  },
);

export const getFeed = authHandler(
  async (
    req: AuthenticatedRequest<any, any, any, any, GetFeedQuery>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user.id;
    const { limit, cursor } = req.validatedQuery;

    const feed = await postService.getFeed({ userId, limit, cursor: cursor ?? null });

    res.status(200).json({
      success: true,
      data: feed,
    });
  },
);
