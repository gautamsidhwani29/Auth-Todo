import express from 'express';
const app = express();
import path from 'path'
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { UserModel, TodoModel } from './db.js';
import { signupSchema, loginSchema } from './validationSchema.js';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { Op } from 'sequelize';
import { authenticate } from './authenticate.js';
const port = process.env.PORT;
import { fileURLToPath } from 'url';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cookieParser());

const main = async () => {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to Mongo Db ");
    app.listen(port, () => { console.log(`Running on ${port}`) });
}
main();

const reqDetailLogger = (req, res, next) => {
    const { url, method } = req;
    const d = new Date();
    console.log(`${url} ${method} ${d.toLocaleString()}`);
    next();
}

const limiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 50,
    message: "Try After 15 mins "
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

app.get('/home', reqDetailLogger, (req, res) => {
    res.send("Home Route");
});

app.post('/signup', reqDetailLogger, async (req, res) => {
    try {
        const { success, error, data } = signupSchema.safeParse(req.body);
        const { username, email, password, gender } = data;

        const existingUser = await UserModel.findOne({
            where: {
                [Op.or]: [
                    { email },
                    { username }
                ]
            }
        });

        if (existingUser) {
            return res.status(409).json({ message: "Email or Username Taken" });
        }
        const hashedPassword = await bcrypt.hash(password, 5);

        const user = await UserModel.create({
            username,
            email,
            password: hashedPassword,
            gender
        });
        return res.status(201).json({
            message: 'User created successfully',
            username: user.username,
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error });
    }
});

app.post('/login', reqDetailLogger, async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Incorrect Email" });
        }
        const matchedPassword = await bcrypt.compare(password, user.password);
        if (!matchedPassword) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const acessToken = jwt.sign({ id: user._id, username: user.username }, process.env.SECRET_KEY);
        const refreshToken = jwt.sign({ id: user._id, username: user.username }, process.env.SECRET_KEY);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.cookie('token', acessToken, {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000
        });
        return res.json({
            message: "Logged In Successfully!",
            username: user.username
        });
    } catch (e) {
        console.error('Login error:', e);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/todo', authenticate, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/authorized', authenticate, reqDetailLogger, async (req, res) => {
    const user = req.user;
    const userDetails = await UserModel.findById(user.id);
    return res.json({
        userDetails
    });
});

app.post('/addtodo', authenticate, reqDetailLogger, async (req, res) => {
    try {
        const user = req.user;
        const userId = user.id;
        const { title } = req.body;

        if (!title) {
            return res.status(400).json({ error: "Title is required" });
        }

        const response = await TodoModel.create({
            title,
            userId
        });

        return res.status(201).json({
            message: `${title} added successfully`,
            response
        });
    } catch (e) {
        console.error("Error adding todo:", e);
        return res.status(500).json({ error: "An error occurred while adding the todo" });
    }
});

app.get('/gettodos', authenticate, reqDetailLogger, async (req, res) => {
    const user = req.user;
    const userId = user.id;
    const data = await TodoModel.find({ userId });
    return res.json({
        message: "Fetched Todos",
        todos: data
    });
});

app.delete('/deletetodo', authenticate, reqDetailLogger, async (req, res) => {
    const { todoId } = req.body;
    if (!todoId) {
        return res.status(400).json({ error: "Todo ID is required" });
    }

    try {
        const deletedTodo = await TodoModel.findByIdAndDelete(todoId);

        if (!deletedTodo) {
            return res.status(404).json({ error: "Todo not found" });
        }

        return res.json({ message: "Todo deleted successfully" });
    } catch (error) {
        console.error("Error deleting todo:", error);
        return res.status(500).json({ error: "An error occurred while deleting the todo" });
    }
});

app.put('/updatetodo', authenticate, async (req, res) => {
    const { todoId, checked } = req.body;
    try {
        const todo = await TodoModel.findByIdAndUpdate(todoId, { isCompleted: checked }, { new: true });
        if (!todo) {
            return res.status(404).json({ message: 'Todo not found' });
        }
        return res.json({ message: 'Todo updated successfully', todo });
    } catch (error) {
        return res.status(500).json({ message: 'Error updating todo', error });
    }
});

app.put('/edittodo', authenticate, reqDetailLogger, async (req, res) => {
    try {
        const { title, todoId } = req.body;
        if (!todoId || !title) {
            return res.status(400).json({ message: 'Todo ID and title are required' });
        }
        const updatedTodo = await TodoModel.findByIdAndUpdate(todoId, { title }, { new: true });
        if (updatedTodo) {
            return res.json({ message: 'Todo updated successfully', updatedTodo });
        } else {
            return res.status(404).json({ message: 'Todo not found' });
        }
    } catch (e) {
        return res.status(500).json({ message: 'Error updating todo', error: e });
    }
});

app.post('/refresh-token', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token missing" });
    }
    try {
        const userData = jwt.verify(refreshToken, process.env.SECRET_KEY);
        const newAccessToken = jwt.sign({ id: userData.id, username: userData.username }, process.env.SECRET_KEY, { expiresIn: '60m' });
        res.cookie('token', newAccessToken, {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000
        });

        return res.json({ message: 'Access token refreshed' });
    } catch (error) {
        return res.status(403).json({ message: "Invalid refresh token" });
    }
});

app.post('/logout', reqDetailLogger, (req, res) => {
    res.clearCookie('token');
    res.clearCookie('refreshToken');
    return res.status(200).json({ message: "Logged out successfully" });
});
