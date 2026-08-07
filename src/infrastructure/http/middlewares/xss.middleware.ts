import { Request, Response, NextFunction } from "express";
import { sanitizeObject } from "@core/utils/sanitizer.util.js";

export const xssProtection = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }

  if (req.query && typeof req.query === "object") {
    const sanitizedQuery = sanitizeObject(req.query as Record<string, any>);
    for (const key of Object.keys(sanitizedQuery)) {
      try {
        (req.query as any)[key] = sanitizedQuery[key];
      } catch {
        // Express 5 query getter fallback
      }
    }
  }

  if (req.params && typeof req.params === "object") {
    const sanitizedParams = sanitizeObject(req.params);
    for (const key of Object.keys(sanitizedParams)) {
      try {
        (req.params as any)[key] = sanitizedParams[key];
      } catch {
        // Express 5 params getter fallback
      }
    }
  }

  next();
};
