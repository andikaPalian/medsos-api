import { NotFoundError, ForbiddenError, DuplicateEntryError } from "@core/errors/index.js";
import {
  CreatePostInput,
  GetFeedDTO,
  GetSavedPostsDTO,
  UpdatePostRequestDTO,
} from "./dto/post-request.dto.js";
import { PaginatedFeedDTO, PostResponseDTO } from "./dto/post-response.dto.js";
import { logger } from "@core/utils/logger.js";
import { paginateCursor, clampLimit } from "@core/utils/pagination.util.js";
import { deleteFromCloudinary } from "@core/utils/cloudinary.util.js";
import { PAGINATION, FEED } from "@core/constants/app.constants.js";
import { postRepository as defaultPostRepo, PostWithDetails } from "./post.repository.js";
import { followRepository as defaultFollowRepo } from "@modules/follow/follow.repository.js";
import { likeRepository as defaultLikeRepo } from "@modules/like/like.repository.js";

const mapPost = (
  post: PostWithDetails,
  likedSet: Set<string>,
  savedSet: Set<string>,
): PostResponseDTO => ({
  id: post.id,
  caption: post.caption,
  totalLikes: post.totalLikes,
  totalComments: post._count.comments,
  createdAt: post.createdAt,
  author: {
    id: post.author.id,
    username: post.author.username,
    profilePic: post.author.profilePic,
  },
  media: post.media,
  isLiked: likedSet.has(post.id),
  isSaved: savedSet.has(post.id),
});

export const createPostService = (
  postRepo = defaultPostRepo,
  followRepo = defaultFollowRepo,
  likeRepo = defaultLikeRepo,
) => {
  const enrichPosts = async (
    viewerId: string,
    posts: PostWithDetails[],
  ): Promise<PostResponseDTO[]> => {
    const postIds = posts.map((p) => p.id);
    const [likedSet, savedSet] = await Promise.all([
      likeRepo.findLikedPostIds(viewerId, postIds),
      postRepo.findSavedPostsIds(viewerId, postIds),
    ]);
    return posts.map((p) => mapPost(p, likedSet, savedSet));
  };

  const getViewablePost = async (
    viewerId: string,
    postId: string,
  ): Promise<PostWithDetails> => {
    const post = await postRepo.findPostById(postId);
    if (!post) throw new NotFoundError("Post");

    if (post.author.id === viewerId) return post;
    if (!post.author.isPrivate) return post;

    const followRecord = await followRepo.findFollow(viewerId, post.author.id);
    if (!followRecord || followRecord.status !== "ACCEPTED") {
      throw new ForbiddenError("This post is not available");
    }

    return post;
  };

  return {
    getViewablePost,

    createPost: async ({
      authorId,
      caption,
      media,
    }: CreatePostInput): Promise<PostResponseDTO> => {
      const post = await postRepo.createPost({ authorId, caption }, media);
      logger.info(`[POST SERVICE] Post created: ${post.id} by ${authorId}`);
      return mapPost(post, new Set(), new Set());
    },

    getPostById: async (viewerId: string, postId: string): Promise<PostResponseDTO> => {
      const post = await getViewablePost(viewerId, postId);
      const [likedSet, savedSet] = await Promise.all([
        likeRepo.findLikedPostIds(viewerId, [postId]),
        postRepo.findSavedPostsIds(viewerId, [postId]),
      ]);
      return mapPost(post, likedSet, savedSet);
    },

    updatePost: async ({
      userId,
      postId,
      caption,
      tags,
      media,
    }: UpdatePostRequestDTO): Promise<PostResponseDTO> => {
      const post = await postRepo.findPostById(postId);
      if (!post) throw new NotFoundError("Post");
      if (post.authorId !== userId) {
        logger.warn(`[POST SERVICE] User ${userId} attempted to update post owned by ${post.authorId}`);
        throw new ForbiddenError("You are not the author of this post");
      }

      if (caption !== undefined) await postRepo.updatePostCaption(postId, caption);
      if (tags !== undefined) await postRepo.replacePostTags(postId, tags);

      if (media) {
        await postRepo.replacePostMedia(postId, media);
        post.media.forEach((m) => {
          if (m.urlPublicId) {
            deleteFromCloudinary(m.urlPublicId, m.type.toLowerCase() as "image" | "video");
          }
        });
      }

      const updatedPost = await postRepo.findPostById(postId);
      logger.info(`[POST SERVICE] Post updated: ${postId} by ${userId}`);

      const [likedSet, savedSet] = await Promise.all([
        likeRepo.findLikedPostIds(userId, [postId]),
        postRepo.findSavedPostsIds(userId, [postId]),
      ]);

      return mapPost(updatedPost!, likedSet, savedSet);
    },

    deletePost: async (userId: string, postId: string): Promise<void> => {
      const post = await postRepo.findPostById(postId);
      if (!post) throw new NotFoundError("Post");
      if (post.authorId !== userId) {
        logger.warn(`[POST SERVICE] User ${userId} attempted to delete post owned by ${post.authorId}`);
        throw new ForbiddenError("You are not the author of this post");
      }

      await postRepo.deletePost(postId);
      post.media.forEach((m) => {
        if (m.urlPublicId) {
          deleteFromCloudinary(m.urlPublicId, m.type.toLowerCase() as "image" | "video");
        }
      });

      logger.info(`[POST SERVICE] Post deleted: ${postId} by ${userId}`);
    },

    getFeed: async ({ userId, limit, cursor }: GetFeedDTO): Promise<PaginatedFeedDTO> => {
      const take = clampLimit(limit, PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

      const following = await followRepo.followingList({
        userId,
        take: FEED.FOLLOWING_FETCH_LIMIT,
        cursor: null,
      });
      const followingIds = following.map((f) => f.user.id);

      const rawPost = await postRepo.findFeedPosts({
        authorIds: [...followingIds, userId],
        take: take + 1,
        cursor,
      });

      const { items, nextCursor, hasNextPage } = paginateCursor(rawPost, take, (p) => p.id);
      const data = await enrichPosts(userId, items);

      return { data, nextCursor, hasNextPage };
    },

    savePost: async (userId: string, postId: string): Promise<void> => {
      const post = await postRepo.findPostById(postId);
      if (!post) throw new NotFoundError("Post");
      await getViewablePost(userId, postId);

      try {
        await postRepo.addSavedPost(userId, postId);
      } catch (error) {
        if (error instanceof DuplicateEntryError) return;
        throw error;
      }

      logger.info(`[POST SERVICE] Post saved: ${postId} by ${userId}`);
    },

    unsavedPost: async (userId: string, postId: string): Promise<void> => {
      const saved = await postRepo.findSavedPost(userId, postId);
      if (!saved) return;

      await postRepo.removeSavedPost(userId, postId);
      logger.info(`[POST SERVICE] Post unsaved: ${postId} by ${userId}`);
    },

    getSavedPosts: async ({
      userId,
      limit,
      cursor,
    }: GetSavedPostsDTO): Promise<PaginatedFeedDTO> => {
      const take = clampLimit(limit, PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

      const rawPost = await postRepo.findSavedPostsList({ userId, take: take + 1, cursor });
      const { items, nextCursor, hasNextPage } = paginateCursor(rawPost, take, (p) => p.id);
      const data = await enrichPosts(userId, items);

      return { data, nextCursor, hasNextPage };
    },
  };
};

export type PostService = ReturnType<typeof createPostService>;
export const postService = createPostService();
