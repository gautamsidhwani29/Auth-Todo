import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

export const authenticate = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        console.log("Login first")
        res.redirect('/login');
    }

    try {
        const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decodedToken;
        next();
    } catch (e) {
        return res.status(403).json({ message: 'Invalid Token' });
    }
};
