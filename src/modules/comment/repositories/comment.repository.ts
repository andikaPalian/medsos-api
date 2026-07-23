import { Comment, Prisma } from "@prisma/client";
import { prisma } from "../../../config/client.js";
import { handlePrismaError } from "../../../common/utils/prismaErrorHandler.js";

const commentWithRepliesInclude = Prisma.validator<Prisma.CommentInclude>()({
  author: {
    select: {
      id: true,
      username: true,
      profilePic: true,
    },
  },
  replies: {
    include: {
      author: {
        select: {
          id: true,
          username: true,
          profilePic: true,
        },
      },
    },
  },
  _count: {
    select: {
      replies: true,
    },
  },
});

export type CommentWithReplies = Prisma.CommentGetPayload<{
  include: typeof commentWithRepliesInclude;
}>;

interface CreateCommentInput {
  authorId: string;
  postId: string;
  content: string;
  parentId?: string | null;
}

interface GetCommentByPostQueryArgs {
  postId: string;
  take: number;
  cursor: string | null;
}

export const findCommentById = async (commentId: string): Promise<Comment | null> => {
  return await prisma.comment.findUnique({
    where: {
      id: commentId,
    },
  });
};

export const createComment = async ({
  authorId,
  postId,
  content,
  parentId,
}: CreateCommentInput): Promise<CommentWithReplies> => {
  try {
    return await prisma.comment.create({
      data: {
        authorId,
        postId,
        content,
        parentId,
      },
      include: commentWithRepliesInclude,
    });
  } catch (error) {
    return handlePrismaError(error);
  }
};

export const deleteComment = async (commentId: string): Promise<void> => {
  try {
    await prisma.comment.delete({
      where: {
        id: commentId,
      },
    });
  } catch (error) {
    handlePrismaError(error);
  }
};

export const findCommentsByPost = async ({
  postId,
  take,
  cursor,
}: GetCommentByPostQueryArgs): Promise<CommentWithReplies[]> => {
  return await prisma.comment.findMany({
    where: {
      postId,
    },
    include: commentWithRepliesInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });
};
