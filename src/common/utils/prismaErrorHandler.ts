import { Prisma } from "@prisma/client";
import {
  DatabaseError,
  DuplicateEntryError,
  RecordNotFoundError,
  RelatedRecordNotFoundError,
} from "../error/domain.error.js";

export const handlePrismaError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002": {
        const target = error.meta?.target as string[] | undefined;
        const field = target?.[0] ?? "unknown";
        throw new DuplicateEntryError(field);
      }

      case "P2025":
        throw new RecordNotFoundError("Record");

      case "P2003":
        throw new RelatedRecordNotFoundError();

      case "P2034":
        throw new DatabaseError("Transaction conflict, please retry", error.code);

      default:
        throw new DatabaseError("Unexpected database error", error.code);
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    throw new DatabaseError("Invalid data provided to database");
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    throw new DatabaseError("Database connection failed");
  }

  throw error;
};
