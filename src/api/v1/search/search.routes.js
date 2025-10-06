import express from "express";
import { userAuth } from "../../../middlewares/userMiddleware.js";
import { seearchUserByUsernameController } from "./search.controller.js";

export const searchRouter = express.Router();

searchRouter.get("/users", userAuth, seearchUserByUsernameController);