import express from "express";
import { userAuth } from "../../../middlewares/authMiddleware.js";
import { seearchUserByUsernameController } from "./search.controller.js";

export const searchRouter = express.Router();

searchRouter.get("/users", userAuth, seearchUserByUsernameController);