import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/errorHandler.js";
import { verifyToken } from "../utils/jwt.js";

export const userAuth = catchAsync(async (req, res, next) => {
  // First check fot access token in cookies
  let token = req.cookies?.accessToken;

  // If not found in cookies, check the Authorization header
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // If still not found, throw an error
  if (!token) {
    throw new AppError("Authentication failed. Access token is missing. Please login.", 401);
  }

  // Verify the token
  try {
    const decoded = await verifyToken(token);

    // Attach payload to request object
    req.user = {
      id: decoded.id,
    };

    // Continue to the next middleware
    return next();
  } catch (error) {
    // Handle token verification errors
    const errorMessage =
      error.name === "TokenExpiredError"
        ? "Unauthorized: Access token expired. Please refresh your session."
        : "Unauthorized: Invalid token structure";

    throw new AppError(errorMessage, 401);
  }
});
