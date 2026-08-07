import cron from "node-cron";
import { prisma } from "@core/config/database.config.js";
import { deleteFromCloudinary } from "@core/utils/cloudinary.util.js";
import { logger } from "@core/utils/logger.js";

export const autoCleanUpStories = async (): Promise<void> => {
  try {
    const expiredStories = await prisma.story.findMany({
      where: {
        expiresAt: { lt: new Date() },
      },
      include: { media: true },
    });

    if (expiredStories.length === 0) return;

    await Promise.all(
      expiredStories.flatMap((story) =>
        story.media.map((media) =>
          media.urlPublicId
            ? deleteFromCloudinary(media.urlPublicId, media.type.toLowerCase() as "image" | "video")
            : Promise.resolve(),
        ),
      ),
    );

    const storyIds = expiredStories.map((story) => story.id);

    await prisma.$transaction([
      prisma.storyViewer.deleteMany({ where: { storyId: { in: storyIds } } }),
      prisma.media.deleteMany({ where: { storyId: { in: storyIds } } }),
      prisma.story.deleteMany({ where: { id: { in: storyIds } } }),
    ]);

    logger.info(`[JOB: STORY CLEANUP] Deleted ${storyIds.length} expired stories and associated assets.`);
  } catch (error) {
    const err = error as Error;
    logger.error(`[JOB: STORY CLEANUP] Error during cleanup: ${err.message}`);
  }
};

export const initStoryCleanupCron = (): cron.ScheduledTask => {
  return cron.schedule("0 */6 * * *", async () => {
    logger.info("[JOB: STORY CLEANUP] Cron triggered: cleaning up expired stories...");
    await autoCleanUpStories();
  });
};
