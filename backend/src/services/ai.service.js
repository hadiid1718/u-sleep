import {
  OPENAI_API_KEY,
  OPENAI_MODEL,
  GOOGLE_GEMINI_API_KEY,
  GOOGLE_GEMINI_MODEL,
  PROPOSAL_GENERATION_TIMEOUT,
} from '../config/env.js';

/**
 * AI Proposal Generation Service
 * Supports both OpenAI and Google Gemini
 */
class AIProposalService {
  constructor() {
    this.openaiApiKey = OPENAI_API_KEY;
    this.openaiModel = OPENAI_MODEL || 'gpt-4-turbo';
    this.geminiApiKey = GOOGLE_GEMINI_API_KEY;
    this.geminiModel = GOOGLE_GEMINI_MODEL || 'gemini-1.5-flash';
    this.timeout = parseInt(PROPOSAL_GENERATION_TIMEOUT) || 30000;
  }

  /**
   * Generate proposal with specified AI service
   * @param {Object} params - Generation parameters
   * @param {String} params.aiService - 'openai' or 'gemini'
   * @param {Object} params.job - Job details
   * @param {Object} params.user - User profile information
   * @param {String} params.caseStudy - Optional case study for upgrade
   * @returns {Promise<String>} - Generated proposal text
   */
  async generateProposal(params) {
    const { aiService = 'openai', job, user, caseStudy } = params;

    if (!job || !user) {
      throw new Error('Job and user details are required');
    }

    try {
      let proposal;

      if (aiService === 'gemini') {
        proposal = await this.generateWithGemini(job, user, caseStudy);
      } else {
        proposal = await this.generateWithOpenAI(job, user, caseStudy);
      }

      return proposal;
    } catch (error) {
      console.error(`Error generating proposal with ${aiService}:`, error);
      throw new Error(`Proposal generation failed: ${error.message}`, {
        cause: error,
      });
    }
  }

  /**
   * Generate proposal using OpenAI
   */
  async generateWithOpenAI(job, user, caseStudy) {
    const prompt = this.buildPrompt(job, user, caseStudy);

    const payload = {
      model: this.openaiModel,
      messages: [
        {
          role: 'system',
          content: `You are an expert Upwork proposal writer specializing in crafting high-converting, personalized proposals. 
Your proposals are:
- Professional yet conversational
- Personalized to the specific job and client
- Result-oriented
- Confident without being arrogant
- Concise (3-5 short paragraphs)
- Include a clear call-to-action`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
      top_p: 0.9,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `OpenAI API Error: ${error.error?.message || response.statusText}`
        );
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Proposal generation timed out', { cause: error });
      }
      throw error;
    }
  }

  /**
   * Generate proposal using Google Gemini
   */
  async generateWithGemini(job, user, caseStudy) {
    const prompt = this.buildPrompt(job, user, caseStudy);

    const payload = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      systemInstruction: {
        parts: [
          {
            text: `You are an expert Upwork proposal writer specializing in crafting high-converting, personalized proposals. 
Your proposals are:
- Professional yet conversational
- Personalized to the specific job and client
- Result-oriented
- Confident without being arrogant
- Concise (3-5 short paragraphs)
- Include a clear call-to-action`,
          },
        ],
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
        topP: 0.9,
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Gemini API Error: ${error.error?.message || response.statusText}`
        );
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Proposal generation timed out', { cause: error });
      }
      throw error;
    }
  }

  /**
   * Build proposal prompt
   */
  buildPrompt(job, user, caseStudy) {
    const platform =
      job?.source === 'freelancer_api' ? 'Freelancer.com' : 'Upwork';
    const profileUrl =
      platform === 'Freelancer.com'
        ? user.jobPreferences?.freelancerProfileUrl || 'N/A'
        : user.jobPreferences?.upworkProfileUrl || 'N/A';

    let prompt = `Generate a professional ${platform} proposal for the following job:

**JOB DETAILS:**
Title: ${job.title}
Description: ${job.description}
Budget: ${job.budgetType === 'fixed' ? `Fixed $${job.budget?.amount}` : `Hourly $${job.hourlyRate?.min}-${job.hourlyRate?.max}`}
Skills Required: ${job.skills?.join(', ') || 'N/A'}
Client Rating: ${job.clientInfo?.rating || 'N/A'}
Proposals Received: ${job.proposalsCount || 'N/A'}

**FREELANCER PROFILE:**
Name: ${user.name}
Role: ${user.jobPreferences?.userRole || 'Freelancer'}
Rate: ${
      user.jobPreferences?.rateType === 'hourly'
        ? `$${user.jobPreferences?.hourlyRate}/hour`
        : `$${user.jobPreferences?.fixedRate} fixed`
    }
Platform: ${platform}
Profile URL: ${profileUrl}
Keywords/Expertise: ${user.jobPreferences?.keywords?.join(', ') || 'N/A'}

**INSTRUCTIONS:**
1. Create a personalized, compelling opening that shows you understand the client's specific needs
2. Highlight 2-3 key strengths or experiences relevant to this job
3. Briefly describe your approach or solution strategy
4. Mention timeline/delivery expectations
5. Include a confident call-to-action (meeting/call request)
6. Keep it concise - 3-5 paragraphs maximum
7. Sound human, confident, and professional - NOT generic or templated
8. Do NOT mention specific pricing details unless necessary`;

    if (caseStudy) {
      prompt += `

**CASE STUDY TO INCORPORATE:**
${caseStudy}

Please integrate this case study naturally into the proposal to add credibility and authority, showing similar past success.`;
    }

    return prompt;
  }

  /**
   * Upgrade proposal with case study
   */
  async upgradeProposalWithCaseStudy(
    proposal,
    job,
    user,
    caseStudy,
    aiService = 'openai'
  ) {
    const upgradePrompt = `Here's an existing proposal:

"${proposal}"

Enhance this proposal by incorporating the following case study to make it more authority-driven and persuasive:

CASE STUDY:
${caseStudy}

- Keep the original structure and flow
- Naturally integrate the case study to show relevant past success
- Maintain the same tone and professionalism
- Keep it concise (still 3-5 paragraphs)
- Make it clear we have done similar work successfully`;

    try {
      let upgradedProposal;

      if (aiService === 'gemini') {
        upgradedProposal = await this.upgradeWithGemini(upgradePrompt);
      } else {
        upgradedProposal = await this.upgradeWithOpenAI(upgradePrompt);
      }

      return upgradedProposal;
    } catch (error) {
      console.error('Error upgrading proposal:', error);
      throw new Error(`Proposal upgrade failed: ${error.message}`, {
        cause: error,
      });
    }
  }

  /**
   * Upgrade with OpenAI
   */
  async upgradeWithOpenAI(upgradePrompt) {
    const payload = {
      model: this.openaiModel,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at enhancing Upwork proposals with case studies while maintaining professionalism and conciseness.',
        },
        {
          role: 'user',
          content: upgradePrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 900,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OpenAI Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Upgrade with Gemini
   */
  async upgradeWithGemini(upgradePrompt) {
    const payload = {
      contents: [
        {
          parts: [
            {
              text: upgradePrompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 900,
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Gemini Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}

export default new AIProposalService();
