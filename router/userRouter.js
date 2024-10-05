import { Router } from 'express';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
const app = express();
import jwt from 'jsonwebtoken';
import { UserModel } from '../db.js';
import { loginSchema, signupSchema } from '../validationSchema.js';
import { authenticate } from '../authenticate.js';
import { Op } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

dotenv.config();
export const userRouter = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


userRouter.post('/signup', async (req, res) => {
    try {
        const { success, error, data } = signupSchema.safeParse(req.body);
        if (!success) return res.status(400).json({ message: error.errors.map(err => err.message) });

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

        const hashedPassword = await bcrypt.hash(password, 10); 
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
        return res.status(500).json({ message: 'Internal server error' });
    }
});

userRouter.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await UserModel.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const matchedPassword = await bcrypt.compare(password, user.password);
        if (!matchedPassword) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const accessToken = jwt.sign({ id: user.id, username: user.username }, process.env.SECRET_KEY, { expiresIn: '60m' });
        const refreshToken = jwt.sign({ id: user.id, username: user.username }, process.env.SECRET_KEY, { expiresIn: '7d' });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.cookie('token', accessToken, {
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

userRouter.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'signup.html'));
});

userRouter.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'login.html'));
});

userRouter.get('/authorized', authenticate, async (req, res) => {
    const user = req.user;
    const userDetails = await UserModel.findByPk(user.id);
    return res.json({
        userDetails
    });
});

userRouter.post('/refresh-token', async (req, res) => {
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

userRouter.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.clearCookie('refreshToken');
    return res.status(200).json({ message: "Logged out successfully" });
});
