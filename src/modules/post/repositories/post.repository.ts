import { handlePrismaError } from "../../../common/utils/prismaErrorHandler.js";
import { prisma } from "../../../config/client.js";
import { MediaType, Post, Prisma, SavedPost } from "@prisma/client";

const postWithDetailsInclude = Prisma.validator<Prisma.PostInclude>()({
  author: {
    select: {
      id: true,
      profilePic: true,
      username: true,
    },
  },
  media: {
    select: {
      id: true,
      url: true,
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

interface CreatePostInput {
  authorId: string;
  caption?: string | null;
}

interface CreateMediaInput {
  url: string;
  urlPublicId: string;
  type: MediaType;
}

interface FeedQueryArgs {
  authorIds: string[];
  take: number;
  cursor: string | null;
}

interface SavedPostsListQueryArgs {
  userId: string;
  take: number;
  cursor: string | null;
}

export const createPost = async (
  postInput: CreatePostInput,
  mediaInputs: CreateMediaInput[],
): Promise<PostWithDetails> => {
  try {
    return await prisma.post.create({
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
};

export const replacePostTags = async (postId: string, tagNames: string[]): Promise<void> => {
  try {
    await prisma.post.update({
      where: {
        id: postId,
      },
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
};

export const findPostById = async (postId: string): Promise<PostWithDetails | null> => {
  return await prisma.post.findUnique({
    where: {
      id: postId,
    },
    include: postWithDetailsInclude,
  });
};

export const deletePost = async (postId: string): Promise<Post> => {
  try {
    return await prisma.post.delete({
      where: {
        id: postId,
      },
    });
  } catch (error) {
    return handlePrismaError(error);
  }
};

export const findFeedPosts = async ({
  authorIds,
  take,
  cursor,
}: FeedQueryArgs): Promise<PostWithDetails[]> => {
  return await prisma.post.findMany({
    where: {
      authorId: {
        in: authorIds,
      },
    },
    include: postWithDetailsInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });
};

export const updatePostCaption = async (postId: string, caption: string): Promise<Post> => {
  try {
    return await prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        caption,
      },
    });
  } catch (error) {
    return handlePrismaError(error);
  }
};

export const replacePostMedia = async (
  postId: string,
  mediaInputs: CreateMediaInput[],
): Promise<void> => {
  try {
    await prisma.post.update({
      where: {
        id: postId,
      },
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
};

export const findSavedPost = async (userId: string, postId: string): Promise<SavedPost | null> => {
  return await prisma.savedPost.findUnique({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });
};

export const findSavedPostsIds = async (
  userId: string,
  postIds: string[],
): Promise<Set<string>> => {
  const saved = await prisma.savedPost.findMany({
    where: {
      userId,
      postId: {
        in: postIds,
      },
    },
    select: {
      postId: true,
    },
  });

  return new Set(saved.map((s) => s.postId));
};

export const findSavedPostsList = async ({
  userId,
  take,
  cursor,
}: SavedPostsListQueryArgs): Promise<PostWithDetails[]> => {
  const saved = await prisma.savedPost.findMany({
    where: {
      userId,
    },
    include: {
      post: {
        include: postWithDetailsInclude,
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  return saved.map((s) => s.post);
};

export const addSavedPost = async (userId: string, postId: string): Promise<void> => {
  try {
    await prisma.savedPost.create({
      data: {
        userId,
        postId,
      },
    });
  } catch (error) {
    handlePrismaError(error);
  }
};

export const removeSavedPost = async (userId: string, postId: string): Promise<void> => {
  try {
    await prisma.savedPost.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });
  } catch (error) {
    handlePrismaError(error);
  }
};
