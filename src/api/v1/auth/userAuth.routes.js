import express from "express";
import { loginController, registerController } from "./userAuth.controller.js";
import { validateBody } from "../../../middlewares/zodValidator.js";
import { loginSchema, registerSchema } from "../../../validators/userAuthValidation.js";

export const userAuthRouter = express.Router();

userAuthRouter.post("/register", validateBody(registerSchema), registerController);
userAuthRouter.post("/login", validateBody(loginSchema), loginController);