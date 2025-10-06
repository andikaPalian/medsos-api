import { searchUserByUsername } from "./search.service";

export const seearchUserByUsernameController = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const result = await searchUserByUsername(userId, req.query);

        return res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            data: result
        });
    } catch (error) {
        next(error);
    }
};