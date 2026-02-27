import express from 'express';
import cors from 'cors';
import { FRONTEND_URL, PORT } from './config/env.js';

import userRouter from "./routes/user.router.js";
import authRouter from "./routes/auth.router.js";
import demoRouter from "./routes/demo.router.js";
import jobRouter from "./routes/job.router.js";
import proposalRouter from "./routes/proposal.router.js";import productRouter from './routes/product.router.js';import connectToDatabase from './database/mongodb.js';
import cookieParser from 'cookie-parser';
import errorMiddleware from './middleware/error.middleware.js';
import { createDefaultAdmin } from './controller/auth.controller.js';
import arcjetMiddleware from './middleware/arcject.middleware.js';

const app = express();

// CORS configuration
const corsOptions = {
  origin:FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }))

app.use(cookieParser());
app.use(arcjetMiddleware)

app.use("/api/v1/auth", authRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/demo", demoRouter)
app.use("/api/v1/jobs", jobRouter)
app.use("/api/v1/proposals", proposalRouter)
app.use("/api/v1/products", productRouter)

app.use(errorMiddleware)

app.get("/", (req, res)=> {
   res.send("Welcom to U sleep || Upwoek automation  API's!")

})



app.listen(PORT, async()=>{
    console.log(`U Sleep Automation Tool API is running on: http://localhost:${PORT}`);    

    //Database connection function calling
    await connectToDatabase()
    await createDefaultAdmin()
})

export default app;