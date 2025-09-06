import { login, register } from "./userAuth.service.js";

export const registerController = async (req, res, next) => {
    try {
        const user = await register(req.body);

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: user
        });
    } catch (error) {
        next(error);
    }
};

export const loginController = async (req, res, next) => {
    try {
        const token = await login(req.body);

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            data: token
        });
    } catch (error) {
        next(error);
    }
};