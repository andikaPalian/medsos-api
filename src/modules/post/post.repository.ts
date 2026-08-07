import { MediaType, Post, Prisma, SavedPost } from "@prisma/client";
import { prisma } from "@core/config/database.config.js";
import { DatabaseError, DuplicateEntryError } from "@core/errors/index.js";

const postWithDetailsInclude = Prisma.validator<Prisma.PostInclude>()({
  author: {
    select: {
      id: true,
      profilePic: true,
      username: true,
      isPrivate: true,
    },
  },
  media: {
    select: {
      id: true,
      url: true,
      urlPublicId: true,
      type: true,
    },
  },
  _count: {
    select: {
      likes: true,
      comments: true,
    },
  },
});

export type PostWithDetails = Prisma.PostGetPayload<{
  include: typeof postWithDetailsInclude;
}>;

export interface CreatePostInput {
  authorId: string;
  caption?: string | null;
}

export interface CreateMediaInput {
  url: string;
  urlPublicId: string;
  type: MediaType;
}

export interface FeedQueryArgs {
  authorIds: string[];
  take: number;
  cursor: string | null;
}

export interface SavedPostsListQueryArgs {
  userId: string;
  take: number;
  cursor: string | null;
}

const handlePrismaError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = (error.meta?.target as string[])?.join(",") || "unknown";
      throw new DuplicateEntryError(target);
    }
    throw new DatabaseError(error.message, error.code);
  }
  throw error as Error;
};

export const createPostRepository = (db = prisma) => ({
  createPost: async (
    postInput: CreatePostInput,
    mediaInputs: CreateMediaInput[],
  ): Promise<PostWithDetails> => {
    try {
      return await db.post.create({
        data: {
          ...postInput,
          ...(mediaInputs.length > 0 && {
            media: {
              create: mediaInputs,
            },
          }),
        },
        include: postWithDetailsInclude,
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  replacePostTags: async (postId: string, tagNames: string[]): Promise<void> => {
    try {
      await db.post.update({
        where: { id: postId },
        data: {
          tags: {
            deleteMany: {},
            create: tagNames.map((name) => ({
              tag: {
                connectOrCreate: {
                  where: { name },
                  create: { name },
                },
              },
            })),
          },
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  },

  findPostById: async (postId: string): Promise<PostWithDetails | null> => {
    return db.post.findUnique({
      where: { id: postId },
      include: postWithDetailsInclude,
    });
  },

  deletePost: async (postId: string): Promise<Post> => {
    try {
      return await db.post.delete({ where: { id: postId } });
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  findFeedPosts: async ({ authorIds, take, cursor }: FeedQueryArgs): Promise<PostWithDetails[]> => {
    return db.post.findMany({
      where: { authorId: { in: authorIds } },
      include: postWithDetailsInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });
  },

  updatePostCaption: async (postId: string, caption: string): Promise<Post> => {
    try {
      return await db.post.update({
        where: { id: postId },
        data: { caption },
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  replacePostMedia: async (postId: string, mediaInputs: CreateMediaInput[]): Promise<void> => {
    try {
      await db.post.update({
        where: { id: postId },
        data: {
          media: {
            deleteMany: {},
            create: mediaInputs,
          },
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  },

  findSavedPost: async (userId: string, postId: string): Promise<SavedPost | null> => {
    return db.savedPost.findUnique({
      where: { userId_postId: { userId, postId } },
    });
  },

  findSavedPostsIds: async (userId: string, postIds: string[]): Promise<Set<string>> => {
    const saved = await db.savedPost.findMany({
      where: { userId, postId: { in: postIds } },
      select: { postId: true },
    });
    return new Set(saved.map((s) => s.postId));
  },

  findSavedPostsList: async ({ userId, take, cursor }: SavedPostsListQueryArgs): Promise<PostWithDetails[]> => {
    const saved = await db.savedPost.findMany({
      where: { userId },
      include: {
        post: { include: postWithDetailsInclude },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });
    return saved.map((s) => s.post);
  },

  addSavedPost: async (userId: string, postId: string): Promise<void> => {
    try {
      await db.savedPost.create({
        data: { userId, postId },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  },

  removeSavedPost: async (userId: string, postId: string): Promise<void> => {
    try {
      await db.savedPost.delete({
        where: { userId_postId: { userId, postId } },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  },
});

export type PostRepository = ReturnType<typeof createPostRepository>;
export const postRepository = createPostRepository();
