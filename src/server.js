import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import helmet from 'helmet';
import morgan from 'morgan';
import { userAuthRouter } from './api/v1/auth/userAuth.routes.js';
import { AppError } from './utils/errorHandler.js';

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.use('/api/v1/auth', userAuthRouter);

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

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});