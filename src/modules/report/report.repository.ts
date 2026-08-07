import { Prisma } from "@prisma/client";
import { prisma } from "@core/config/database.config.js";
import { DatabaseError } from "@core/errors/index.js";

export interface CreateReportArgs {
  reporterId: string;
  postId: string;
  reason: string;
}

const handlePrismaError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    throw new DatabaseError(error.message, error.code);
  }
  throw error as Error;
};

export const createReportRepository = (db = prisma) => ({
  createReport: async ({ reporterId, postId, reason }: CreateReportArgs): Promise<void> => {
    try {
      await db.report.create({
        data: { reporterId, postId, reason },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  },
});

export type ReportRepository = ReturnType<typeof createReportRepository>;
export const reportRepository = createReportRepository();
