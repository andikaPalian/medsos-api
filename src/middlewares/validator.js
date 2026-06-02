import { AppError } from "../utils/errorHandler.js";

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    const formattedErrors = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));

    const error = new AppErro("Validation error", 400);
    error.errors = formattedErrors;

    return next(error);
  }

  if (result.data.body) req.body = result.data.body;
  if (result.data.query) Object.assign(req.query, result.data.query);
  if (result.data.params) Object.assign(req.params, result.data.params);

  next();
};
