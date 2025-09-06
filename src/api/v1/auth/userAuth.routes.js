import express from "express";
import { loginController, registerController } from "./userAuth.controller.js";

export const userAuthRouter = express.Router();

userAuthRouter.post("/register", registerController);
userAuthRouter.post("/login", loginController);