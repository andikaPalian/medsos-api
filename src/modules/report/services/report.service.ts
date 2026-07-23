import * as reportRepository from "../repositories/report.repository.js";
import * as postRepository from "../../post/repositories/post.repository.js";
import { ReportPostDTO } from "../dto/report-request.dto.js";
import { AppError } from "../../../common/error/errorHandler.js";
import { logger } from "../../../common/utils/logger.js";
import { getViewablePost } from "../../post/services/post.service.js";

export const reportPost = async ({ reporterId, postId, reason }: ReportPostDTO): Promise<void> => {
  const post = await postRepository.findPostById(postId);
  if (!post) throw new AppError("Post not found", 404);

  await getViewablePost(reporterId, postId);

  await reportRepository.createReport({ reporterId, postId, reason });

  logger.info(`[REPORT SERVICE] Post reported: ${postId} by ${reporterId}`);
};
