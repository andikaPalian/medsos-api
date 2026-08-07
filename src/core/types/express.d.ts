import { AuthenticatedUser } from "./common.types.js";

declare global {
  namespace Express {
    interface User extends AuthenticatedUser {}
    interface Request {
      user?: User;
      validatedQuery?: any;
    }
  }
}
