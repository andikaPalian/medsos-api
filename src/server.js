import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import './cron/storyCleanUp.js';
import { userAuthRouter } from './api/v1/auth/userAuth.routes.js';
import { AppError } from './utils/errorHandler.js';
import { connectCloudinary } from './config/cloudinary.js';
import { userRouter } from './api/v1/user/user.routes.js';
import { followRouter } from './api/v1/follow/follow.routes.js';
import { postRouter } from './api/v1/post/post.routes.js';
import { searchRouter } from './api/v1/search/search.routes.js';
import { storyRouter } from './api/v1/story/story.routes.js';
import { Server } from 'socket.io';
import {createServer} from 'http';
import { messageSocket } from './socket/messageSocket.js';

const app = express();
const server = createServer(app);
const port = process.env.PORT;

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log(`User connected with socket id: ${socket.id}`);
    
    messageSocket(socket, io);
});

connectCloudinary();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.use('/api/v1/auth', userAuthRouter);
app.use('/api/v1/user', userRouter);
app.use("/api/v1/follow", followRouter);
app.use("/api/v1/post", postRouter);
app.use("/api/v1/search", searchRouter);
app.use("/api/v1/story", storyRouter);

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

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});