import cron from "node-cron";
import { autoCleanUpStories } from "../api/v1/story/story.cleanup.js";

cron.schedule("0 */6 * * *", async () => {
    console.log("Running cron job to clean up expired stories...");
    await autoCleanUpStories();
});