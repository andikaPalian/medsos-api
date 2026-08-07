import { MediaType, Prisma } from "@prisma/client";
import { prisma } from "@core/config/database.config.js";
import { DatabaseError } from "@core/errors/index.js";

const storyWithDetailsInclude = Prisma.validator<Prisma.StoryInclude>()({
  user: {
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
  viewers: {
    select: {
      id: true,
      user: {
        select: {
          id: true,
        },
      },
    },
  },
  _count: {
    select: {
      viewers: true,
    },
  },
});

const storyViewerInclude = Prisma.validator<Prisma.StoryViewerInclude>()({
  user: {
    select: {
      id: true,
      profilePic: true,
      username: true,
    },
  },
  story: {
    select: {
      id: true,
    },
  },
});

export type StoryWithDetails = Prisma.StoryGetPayload<{
  include: typeof storyWithDetailsInclude;
}>;

export type StoryViewerDetails = Prisma.StoryViewerGetPayload<{
  include: typeof storyViewerInclude;
}>;

export interface StoryInput {
  userId: string;
  isCloseFriends: boolean;
  expiresAt: Date;
}

export interface MediaInput {
  url: string;
  urlPublicId: string;
  type: MediaType;
}

const handlePrismaError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    throw new DatabaseError(error.message, error.code);
  }
  throw error as Error;
};

export const createStoryRepository = (db = prisma) => ({
  createStory: async (
    storyInput: StoryInput,
    mediaInputs: MediaInput[],
  ): Promise<StoryWithDetails> => {
    try {
      return await db.story.create({
        data: {
          ...storyInput,
          ...(mediaInputs.length > 0 && {
            media: {
              create: mediaInputs,
            },
          }),
        },
        include: storyWithDetailsInclude,
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  findStoryById: async (storyId: string): Promise<StoryWithDetails | null> => {
    return db.story.findUnique({
      where: { id: storyId },
      include: storyWithDetailsInclude,
    });
  },

  findStoriesByUserId: async (userId: string): Promise<StoryWithDetails[]> => {
    return db.story.findMany({
      where: { userId },
      include: storyWithDetailsInclude,
    });
  },

  createStoryViewer: async (storyId: string, userId: string): Promise<StoryViewerDetails> => {
    try {
      return await db.storyViewer.create({
        data: { storyId, userId },
        include: storyViewerInclude,
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  },

  findStoryViewer: async (storyId: string): Promise<StoryViewerDetails[]> => {
    return db.storyViewer.findMany({
      where: { storyId },
      include: storyViewerInclude,
      orderBy: { viewedAt: "desc" },
    });
  },

  deleteStory: async (storyId: string): Promise<void> => {
    try {
      await db.story.delete({ where: { id: storyId } });
    } catch (error) {
      handlePrismaError(error);
    }
  },

  findExpiredStories: async (): Promise<StoryWithDetails[]> => {
    return db.story.findMany({
      where: {
        expiresAt: { lt: new Date() },
      },
      include: storyWithDetailsInclude,
    });
  },
});

export type StoryRepository = ReturnType<typeof createStoryRepository>;
export const storyRepository = createStoryRepository();
