import { NotFoundError } from "@core/errors/index.js";
import { logger } from "@core/utils/logger.js";
import { ReportPostDTO } from "./dto/report-request.dto.js";
import { reportRepository as defaultReportRepo } from "./report.repository.js";
import { postRepository as defaultPostRepo } from "../post/post.repository.js";
import { postService as defaultPostService } from "../post/post.service.js";

export const createReportService = (
  reportRepo = defaultReportRepo,
  postRepo = defaultPostRepo,
  postService = defaultPostService,
) => ({
  reportPost: async ({ reporterId, postId, reason }: ReportPostDTO): Promise<void> => {
    const post = await postRepo.findPostById(postId);
    if (!post) throw new NotFoundError("Post");

    await postService.getViewablePost(reporterId, postId);

    await reportRepo.createReport({ reporterId, postId, reason });
    logger.info(`[REPORT SERVICE] Post reported: ${postId} by ${reporterId}`);
  },
});

export type ReportService = ReturnType<typeof createReportService>;
export const reportService = createReportService();
