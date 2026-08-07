import { Comment, Prisma } from "@prisma/client";
import { prisma } from "@core/config/database.config.js";
import { DatabaseError } from "@core/errors/index.js";

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

export interface CreateCommentInput {
  authorId: string;
  postId: string;
  content: string;
  parentId?: string | null;
}

export interface GetCommentByPostQueryArgs {
  postId: string;
  take: number;
  cursor: string | null;
}

const handlePrismaError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    throw new DatabaseError(error.message, error.code);
  }
  throw error as Error;
};

export const createCommentRepository = (db = prisma) => ({
  findCommentById: async (commentId: string): Promise<Comment | null> => {
    return db.comment.findUnique({ where: { id: commentId } });
  },

  createComment: async ({
    authorId,
    postId,
    content,
    parentId,
  }: CreateCommentInput): Promise<CommentWithReplies> => {
    try {
      return await db.comment.create({
        data: { authorId, postId, content, parentId },
        include: commentWithRepliesInclude,
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  deleteComment: async (commentId: string): Promise<void> => {
    try {
      await db.comment.delete({ where: { id: commentId } });
    } catch (error) {
      handlePrismaError(error);
    }
  },

  findCommentsByPost: async ({
    postId,
    take,
    cursor,
  }: GetCommentByPostQueryArgs): Promise<CommentWithReplies[]> => {
    return db.comment.findMany({
      where: { postId },
      include: commentWithRepliesInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });
  },
});

export type CommentRepository = ReturnType<typeof createCommentRepository>;
export const commentRepository = createCommentRepository();
