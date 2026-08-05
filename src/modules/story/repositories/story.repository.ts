import { MediaType, Prisma } from "@prisma/client";
import { prisma } from "../../../config/client.js";
import { handlePrismaError } from "../../../common/utils/prismaErrorHandler.js";

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

type StoryViewerDetails = Prisma.StoryViewerGetPayload<{
  include: typeof storyViewerInclude;
}>;

interface StoryInput {
  userId: string;
  isCloseFriends: boolean;
  expiresAt: Date;
}

interface MediaInput {
  url: string;
  urlPublicId: string;
  type: MediaType;
}

export const createStory = async (
  storyInput: StoryInput,
  mediaInputs: MediaInput[],
): Promise<StoryWithDetails> => {
  try {
    return await prisma.story.create({
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
};

export const findStoryById = async (storyId: string): Promise<StoryWithDetails | null> => {
  return await prisma.story.findUnique({
    where: {
      id: storyId,
    },
    include: storyWithDetailsInclude,
  });
};

export const findStoriesByUserId = async (userId: string): Promise<StoryWithDetails[]> => {
  return await prisma.story.findMany({
    where: {
      userId,
    },
    include: storyWithDetailsInclude,
  });
};

export const createStoryViewer = async (
  storyId: string,
  userId: string,
): Promise<StoryViewerDetails> => {
  try {
    return await prisma.storyViewer.create({
      data: {
        storyId,
        userId,
      },
      include: storyViewerInclude,
    });
  } catch (error) {
    return handlePrismaError(error);
  }
};

export const findStoryViewer = async (storyId: string): Promise<StoryViewerDetails[]> => {
  return await prisma.storyViewer.findMany({
    where: {
      storyId,
    },
    include: storyViewerInclude,
    orderBy: {
      viewedAt: "desc",
    },
  });
};

export const deleteStory = async (storyId: string): Promise<void> => {
  try {
    await prisma.story.delete({
      where: {
        id: storyId,
      },
    });
  } catch (error) {
    handlePrismaError(error);
  }
};
