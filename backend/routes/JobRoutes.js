const express =require('express')
const { searchJobs } = require('../Services/UpworkServices');
const { analyzeJob } = require('../controllers/JobController');

const jobRouter = express.Router()


jobRouter.post("/search", searchJobs);
jobRouter.post("analyize", analyzeJob)


module.exports = jobRouter;