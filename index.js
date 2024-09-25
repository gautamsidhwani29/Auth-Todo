const express = require('express');
const app = express();
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const port = process.env.PORT;
const session = require('express-session');
const cookieParser = require('cookie-parser');
const {UserModel} = require('../practice/db');
const {z} = require('zod');
const bcrypt = require('bcrypt');
const { default: mongoose } = require('mongoose');
require('dotenv').config();

app.use(express.json());
app.use(cookieParser());

const main = async()=>{
await mongoose.connect(process.env.MONGO_URL);
console.log("Connected to Mongo Db ")
app.listen(port, () => { console.log(`Running on ${port}`) });
}

const reqDetailLogger = (req, res, next) => {
    const { url, method } = req;
    const d = new Date();
    console.log(url + " " + method + " " + d.toLocaleString());
    next();
}

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: "Try After 15 mins "
});

const allowedOrigins = ['http://localhost:3000'];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error('Not Allowed by CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
};

app.use(cors(corsOptions));

app.use(limiter);

app.use(session({
    secret : process.env.SESSION_SECRET,
    resave : false,
    saveUninitialized : true,
    cookie : {
        secure : false,
        httpOnly : true,
        maxAge : 30 * 60 *1000
    }
}))

app.post('/signup',(req,res)=>{

})


app.post('/login',reqDetailLogger,(req,res)=>{
    const {userId,username}  = req.body;

    req.session.userId = userId
    req.session.username = username
    res.send("User Logged In And Session started!");
});

app.get('/profile',reqDetailLogger, (req,res)=>{
    if(req.session.userId){
        res.send(`Welcome ${req.session.username}`)
    } else{
        res.status(401).send('Unauthorized: No session found.');
    }
})

app.post('/logout',reqDetailLogger, (req, res) => {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).send('Could not log out.');
      }
      res.send('Logged out successfully.');
    });
});
