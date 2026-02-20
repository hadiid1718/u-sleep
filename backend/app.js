import express from 'express';
import cors from 'cors';
import { PORT } from './config/env.js';

import userRouter from "./routes/user.router.js";
import authRouter from "./routes/auth.router.js";
import demoRouter from "./routes/demo.router.js";
import connectToDatabase from './database/mongodb.js';
import cookieParser from 'cookie-parser';
import errorMiddleware from './middleware/error.middleware.js';
import { createDefaultAdmin } from './controller/auth.controller.js';

const app = express();

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }))

app.use(cookieParser());

app.use("/api/v1/auth", authRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/demo", demoRouter)

app.use(errorMiddleware)

app.get("/", (req, res)=> {
   res.send("Welcom to subscription tracker API!")

})



app.listen(PORT, async()=>{
    console.log(`Subscription Tracker API is running on: http://localhost:${PORT}`);    

    //Database connection function calling
    await connectToDatabase()
    await createDefaultAdmin()
})

export default app;