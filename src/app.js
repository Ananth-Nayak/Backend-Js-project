import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

const app = express()

app.use(cors({
  origin:process.env.CORS,
  credentials: true
}))

app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true,limit:"16kb"}));
app.use(express.static("public"));
app.use(cookieParser());

// routes import
import userRouter from './routes/user.routes.js'


// routes declaration
app.use('/users',userRouter);
// we write like bcz, users can have multiple task(endpoint) like users/login,
// users/profile or etc.. so we define all the endpoint that related to users in userRouter, and it will be prefix with /users, like /users/register, /users/login,etc..
// this is to avoid mess in the app.js if we write everything in single place


export { app }