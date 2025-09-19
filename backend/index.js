const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');
const adminRouter = require('./routes/AdminRoutes');
const userRouter = require('./routes/UserRoutes');


const app =express()
app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/admiin", adminRouter)
app.use("/api/user", userRouter)



const PORT = 8080;
app.listen(PORT,()=>{
    console.log(`Server is running on port : http://localhost:${PORT}`);
})