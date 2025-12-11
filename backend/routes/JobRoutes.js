const express = require('express');
const { searchJobs, analyzeJob, getJobById } = require('../controllers/JobController');

const jobRouter = express.Router();

jobRouter.post('/search', searchJobs);
jobRouter.post('/analyze', analyzeJob);  
jobRouter.get('/:id', getJobById);

module.exports = jobRouter;
