const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  // Analyze multiple jobs and assign quality scores
  async analyzeJobs(jobs, userPreferences) {
    try {
      console.log(`🤖 Analyzing ${jobs.length} jobs with Gemini AI...`);

      const analyzedJobs = await Promise.all(
        jobs.map(job => this.analyzeSingleJob(job, userPreferences))
      );

      return analyzedJobs;

    } catch (error) {
      console.error('❌ Gemini AI Error:', error.message);
      // If AI fails, return jobs with default scores
      return jobs.map(job => ({ ...job, score: 50, aiAnalysis: 'AI analysis unavailable' }));
    }
  }

  // Analyze a single job
  async analyzeSingleJob(job, userPreferences) {
    try {
      const prompt = this.buildAnalysisPrompt(job, userPreferences);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysis = response.text();

      // Parse AI response to extract score and insights
      const parsed = this.parseAIResponse(analysis);

      return {
        ...job,
        score: parsed.score,
        aiAnalysis: parsed.analysis,
        redFlags: parsed.redFlags,
        greenFlags: parsed.greenFlags,
        recommendation: parsed.recommendation
      };

    } catch (error) {
      console.error(`❌ Error analyzing job ${job.id}:`, error.message);
      return {
        ...job,
        score: 50,
        aiAnalysis: 'Analysis failed',
        redFlags: [],
        greenFlags: [],
        recommendation: 'Manual review recommended'
      };
    }
  }

  // Build prompt for AI analysis
  buildAnalysisPrompt(job, userPreferences) {
    return `
You are an expert Upwork job analyst. Analyze this job posting and rate its quality for a ${userPreferences.accountType}.

USER PREFERENCES:
- Keywords: ${userPreferences.keywords.join(', ')}
- Min Hourly Rate: $${userPreferences.hourlyRate}/hr
- Min Fixed Rate: $${userPreferences.fixedRate}
- Account Type: ${userPreferences.accountType}
- Bad Job Criteria: ${userPreferences.badJobCriteria.join(', ')}

JOB DETAILS:
Title: ${job.title}
Description: ${job.description}
Budget: ${job.budgetType === 'hourly' ? `$${job.budget.min}-$${job.budget.max}/hr` : `$${job.budget.amount} fixed`}
Duration: ${job.duration}
Proposals: ${job.proposals}
Client Rating: ${job.clientInfo.rating}
Client Total Spent: $${job.clientInfo.totalSpent}
Client Hire Rate: ${job.clientInfo.hireRate}%
Payment Verified: ${job.clientInfo.paymentVerified}

Analyze this job and provide:
1. Quality Score (0-100) - How good is this job for the freelancer?
2. Red Flags - List any concerns or negative aspects
3. Green Flags - List positive aspects
4. Recommendation - Should they apply? (Highly Recommended / Recommended / Consider Carefully / Avoid)
5. Brief Analysis - 2-3 sentences explaining your rating

Format your response EXACTLY like this:
SCORE: [number 0-100]
RED_FLAGS: [comma-separated list or "None"]
GREEN_FLAGS: [comma-separated list or "None"]
RECOMMENDATION: [one of the four options above]
ANALYSIS: [your 2-3 sentence analysis]
    `.trim();
  }

  // Parse AI response
  parseAIResponse(response) {
    try {
      const scoreMatch = response.match(/SCORE:\s*(\d+)/i);
      const redFlagsMatch = response.match(/RED_FLAGS:\s*(.+?)(?=\n|$)/i);
      const greenFlagsMatch = response.match(/GREEN_FLAGS:\s*(.+?)(?=\n|$)/i);
      const recommendationMatch = response.match(/RECOMMENDATION:\s*(.+?)(?=\n|$)/i);
      const analysisMatch = response.match(/ANALYSIS:\s*(.+?)(?=\n\n|$)/is);

      return {
        score: scoreMatch ? parseInt(scoreMatch[1]) : 50,
        redFlags: this.parseFlags(redFlagsMatch?.[1]),
        greenFlags: this.parseFlags(greenFlagsMatch?.[1]),
        recommendation: recommendationMatch?.[1]?.trim() || 'Manual review needed',
        analysis: analysisMatch?.[1]?.trim() || response.substring(0, 200)
      };

    } catch (error) {
      console.error('Error parsing AI response:', error);
      return {
        score: 50,
        redFlags: [],
        greenFlags: [],
        recommendation: 'Manual review needed',
        analysis: response.substring(0, 200)
      };
    }
  }

  parseFlags(flagString) {
    if (!flagString || flagString.toLowerCase().includes('none')) {
      return [];
    }
    return flagString.split(',').map(f => f.trim()).filter(f => f);
  }
}

module.exports = new GeminiService();