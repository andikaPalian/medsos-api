import prisma from "../../../config/client.js";
import {v2 as cloudinary} from 'cloudinary';

export const autoCleanUpStories = async () => {
    try {
        const expiredStories = await prisma.story.findMany({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            },
            include: {
                media: true
            }
        });

        if (expiredStories.length === 0) return;

        // for (const story of expiredStories) {
        //     for (const media of story.media) {
        //         if (media.urlPublicId) {
        //             await cloudinary.uploader.destroy(media.urlPublicId);
        //         }
        //     }
        // };

        // Delete all media in parallel using Promise.all in cloudinary
        await Promise.all(
            // Using flatMap to flatten the media array of each story into a single array of media
            expiredStories.flatMap((story) => 
            story.media.map((media) => 
            // Destroy the media if it has a urlPublicId and return a Promise.resolve() if it doesn't
            media.urlPublicId ? cloudinary.uploader.destroy(media.urlPublicId) : Promise.resolve()))
        );

        const storyIds = expiredStories.map((story) => story.id);

        await prisma.$transaction([
            prisma.storyViewer.deleteMany({
                where: {
                    storyId: {
                        in: storyIds
                    }
                }
            }),
            prisma.media.deleteMany({
                where: {
                    storyId: {
                        in: storyIds
                    }
                }
            }),
            prisma.story.deleteMany({
                where: {
                    id: {
                        in: storyIds
                    }
                }
            })
        ]);

        console.log(`[Stories Cleanup] Deleted ${storyIds.length} expired stories`);
    } catch (error) {
        console.error("Error cleaning up stories: ", error);
        throw error;
    }
};