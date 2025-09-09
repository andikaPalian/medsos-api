import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import { userAuthRouter } from './api/v1/auth/userAuth.routes.js';
import { AppError } from './utils/errorHandler.js';
import { connectCloudinary } from './config/cloudinary.js';
import { userRouter } from './api/v1/user/user.routes.js';

const app = express();
const port = process.env.PORT;
connectCloudinary();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.use('/api/v1/auth', userAuthRouter);
app.use('/api/v1/user', userRouter);

// Error handler 
app.use((err, req, res, next) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message
        });
    }
    return res.status(500).json({
        message: "Internal server error"
    });
});

// Handle multer errors
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
    } else if (err) {
        console.error("Unexpected error:", err)
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
    next();
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});