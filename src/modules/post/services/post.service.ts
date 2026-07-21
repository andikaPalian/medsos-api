import * as postRepository from "../repositories/post.repository.js";
import * as followRepository from "../../follow/repositories/follow.repository.js";
import * as mediaService from "../../media/services/media.service.js";
import * as likeRepository from "../../like/repositories/like.repository.js";
import { AppError } from "../../../common/error/errorHandler.js";
import { CreatePostInput, GetFeedDTO, UpdatePostRequestDTO } from "../dto/post-request.dto.js";
import { PaginatedFeedDTO, PostResponseDTO } from "../dto/post-response.dto.js";
import { logger } from "../../../common/utils/logger.js";
import { paginateCursor } from "../../../common/utils/pagination.js";

const mapPost = (
  post: postRepository.PostWithDetails,
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

const enrichPosts = async (
  viewerId: string,
  posts: postRepository.PostWithDetails[],
): Promise<PostResponseDTO[]> => {
  const postIds = posts.map((p) => p.id);
  const [likedSet, savedSet] = await Promise.all([
    likeRepository.findLikedPostIds(viewerId, postIds),
    postRepository.findSavedPostsIds(viewerId, postIds),
  ]);

  return posts.map((p) => mapPost(p, likedSet, savedSet));
};

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const FEED_FOLLOWING_FETCH_LIMIT = 10000;

const getViewablePost = async (
  viewerId: string,
  postId: string,
): Promise<postRepository.PostWithDetails> => {
  const post = await postRepository.findPostById(postId);
  if (!post) throw new AppError("Post not found", 404);

  if (post.author.id === viewerId) return post;
  if (!post.author.isPrivate) return post;

  const followRecord = await followRepository.findFollow(viewerId, post.author.id);
  if (!followRecord || followRecord.status !== "ACCEPTED") {
    throw new AppError("This post is not available", 403);
  }

  return post;
};

export const createPost = async ({
  authorId,
  caption,
  media,
}: CreatePostInput): Promise<PostResponseDTO> => {
  const post = await postRepository.createPost({ authorId, caption }, media);

  logger.info(`[POST SERVICE] Post created: ${post.id} by ${authorId}`);

  return mapPost(post, new Set(), new Set());
};

export const getPostById = async (viewerId: string, postId: string): Promise<PostResponseDTO> => {
  const post = await getViewablePost(viewerId, postId);
  const [likedSet, savedSet] = await Promise.all([
    likeRepository.findLikedPostIds(viewerId, [postId]),
    postRepository.findSavedPostsIds(viewerId, [postId]),
  ]);

  return mapPost(post, likedSet, savedSet);
};

export const updatePost = async ({
  userId,
  postId,
  caption,
  tags,
  media,
}: UpdatePostRequestDTO): Promise<PostResponseDTO> => {
  const post = await postRepository.findPostById(postId);
  if (!post) throw new AppError("Post not found", 404);
  if (post.authorId !== userId) {
    logger.warn(`[POST SERVICE] User ${userId} attempted to update post owned by ${post.authorId}`);
    throw new AppError("Unauthorized: You are not the author of this post", 403);
  }

  if (caption !== undefined) await postRepository.updatePostCaption(postId, caption);

  if (tags !== undefined) await postRepository.replacePostTags(postId, tags);

  if (media) {
    await postRepository.replacePostMedia(postId, media);

    post.media.forEach((m) => {
      if (m.urlPublicId) {
        mediaService.deleteAssets(m.urlPublicId, m.type.toLowerCase() as "image" | "video");
      }
    });
  }

  // const updatedPost = await postRepository.findPostById(postId);

  logger.info(`[POST SERVICE] Post updated: ${postId} by ${userId}`);

  const [likedSet, savedSet] = await Promise.all([
    likeRepository.findLikedPostIds(userId, [postId]),
    postRepository.findSavedPostsIds(userId, [postId]),
  ]);

  return mapPost(post, likedSet, savedSet);
};

export const deletePost = async (userId: string, postId: string): Promise<void> => {
  const post = await postRepository.findPostById(postId);
  if (!post) throw new AppError("Post not found", 404);
  if (post.authorId !== userId) {
    logger.warn(`[POST SERVICE] User ${userId} attempted to delete post owned by ${post.authorId}`);
    throw new AppError("Unauthorized: You are not the author of this post", 403);
  }

  await postRepository.deletePost(postId);

  post.media.forEach((m) => {
    if (m.urlPublicId) {
      mediaService.deleteAssets(m.urlPublicId, m.type.toLowerCase() as "image" | "video");
    }
  });

  logger.info(`[POST SERVICE] User ${userId}`);
};

export const getFeed = async ({ userId, limit, cursor }: GetFeedDTO): Promise<PaginatedFeedDTO> => {
  const take = Math.min(MAX_LIMIT, Math.max(1, limit ?? DEFAULT_LIMIT));

  const following = await followRepository.followingList({
    userId,
    take: FEED_FOLLOWING_FETCH_LIMIT,
    cursor: null,
  });
  const followingIds = following.map((f) => f.user.id);

  const rawPost = await postRepository.findFeedPosts({
    authorIds: [...followingIds, userId],
    take: take + 1,
    cursor,
  });

  const { items, nextCursor, hasNextPage } = paginateCursor(rawPost, take, (p) => p.id);
  const data = await enrichPosts(userId, items);

  return {
    data,
    nextCursor,
    hasNextPage,
  };
};
