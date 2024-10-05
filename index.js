import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { todoRouter } from './router/todoRouter.js';
import { userRouter } from './router/userRouter.js';

dotenv.config();
const app = express();
const port = process.env.PORT;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());
app.use(cookieParser());

const main = async () => {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to Mongo Db");
    app.listen(port, () => { console.log(`Running on ${port}`) });
}
main();

const limiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 50,
    message: "Try After 15 mins"
});

const allowedOrigins = ['http://localhost:3000'];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not Allowed by CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
};

app.use(cors(corsOptions));
app.use(limiter);

app.get('/home', (req, res) => {
    res.send("Home Route");
});

app.use('/user', userRouter);
app.use('/todo', todoRouter);
