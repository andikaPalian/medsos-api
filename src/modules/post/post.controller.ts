import { Request, Response } from "express";
import { postService as defaultPostService } from "./post.service.js";
import { uploadToCloudinary } from "@core/utils/cloudinary.util.js";
import { sendCreated, sendSuccess, sendEmptySuccess } from "@infra/http/helpers/response.helper.js";
import { CreateMediaInput } from "./dto/post-request.dto.js";
import {
  GetFeedQuery,
  GetPostByIdParams,
  GetSavedPostsQuery,
  SavePostParams,
  UpdatePostBody,
  UpdatePostParams,
} from "./post.validation.js";

const deriveMediaType = (mimeType: string): "IMAGE" | "VIDEO" => {
  return mimeType.startsWith("video/") ? "VIDEO" : "IMAGE";
};

const uploadPostFiles = async (
  files: Express.Multer.File[] | undefined,
): Promise<CreateMediaInput[]> => {
  if (!files || files.length === 0) return [];

  return Promise.all(
    files.map(async (f) => {
      const uploaded = await uploadToCloudinary(f);
      return {
        url: uploaded.url,
        urlPublicId: uploaded.publicId,
        type: deriveMediaType(f.mimetype),
      };
    }),
  );
};

export const createPostController = (service = defaultPostService) => ({
  createPost: async (req: Request, res: Response): Promise<void> => {
    const authorId = req.user!.id;
    const { caption } = req.body;
    const files = req.files as Express.Multer.File[];
    const media = await uploadPostFiles(files);

    const post = await service.createPost({ authorId, caption, media });
    sendCreated(res, post, "Post created successfully");
  },

  getPostById: async (req: Request<GetPostByIdParams>, res: Response): Promise<void> => {
    const viewerId = req.user!.id;
    const { postId } = req.params;

    const post = await service.getPostById(viewerId, postId);
    sendSuccess(res, post, "Post retrieved successfully");
  },

  updatePost: async (
    req: Request<UpdatePostParams, unknown, UpdatePostBody>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { postId } = req.params;
    const { caption, tags } = req.body;

    const files = req.files as Express.Multer.File[] | undefined;
    let media: CreateMediaInput[] | undefined = undefined;

    if (files && files.length > 0) {
      media = await uploadPostFiles(files);
    }

    const post = await service.updatePost({
      userId,
      postId,
      caption,
      tags,
      media,
    });

    sendSuccess(res, post, "Post updated successfully");
  },

  deletePost: async (req: Request<GetPostByIdParams>, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { postId } = req.params;

    await service.deletePost(userId, postId);
    sendEmptySuccess(res, "Post deleted successfully");
  },

  getFeed: async (
    req: Request<unknown, unknown, unknown, GetFeedQuery>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { limit, cursor } = req.query;

    const feed = await service.getFeed({
      userId,
      limit: limit ? Number(limit) : 10,
      cursor: cursor ?? null,
    });

    sendSuccess(res, feed, "Feed retrieved successfully");
  },

  savePost: async (req: Request<SavePostParams>, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { postId } = req.params;

    await service.savePost(userId, postId);
    sendEmptySuccess(res, "Post saved successfully");
  },

  unsavePost: async (req: Request<SavePostParams>, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { postId } = req.params;

    await service.unsavedPost(userId, postId);
    sendEmptySuccess(res, "Post unsaved successfully");
  },

  getSavedPosts: async (
    req: Request<unknown, unknown, unknown, GetSavedPostsQuery>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { limit, cursor } = req.query;

    const savedPosts = await service.getSavedPosts({
      userId,
      limit: limit ? Number(limit) : 10,
      cursor: cursor ?? null,
    });

    sendSuccess(res, savedPosts, "Saved posts retrieved successfully");
  },
});

export type PostController = ReturnType<typeof createPostController>;
export const postController = createPostController();
