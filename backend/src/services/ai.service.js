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
    this.defaultProposalResponse = `Hi, what specific features or functionalities do you envision for your real-time video communication platform? Have you identified any particular challenges or requirements for integrating AI captions?

Similar project: We developed a real-time video communication solution with group call functionalities and AI captioning for a client, enhancing user engagement.

What time are you available tomorrow for a quick call?`;
  }

  getDefaultProposalResponse() {
    return this.defaultProposalResponse;
  }

  resolveProposalProvider(preferred = 'openai') {
    const requested = String(preferred || 'openai').toLowerCase();
    const hasOpenAI = Boolean(this.openaiApiKey);
    const hasGemini = Boolean(this.geminiApiKey);

    if (requested === 'gemini') {
      if (hasGemini) return 'gemini';
      if (hasOpenAI) return 'openai';
    } else {
      if (hasOpenAI) return 'openai';
      if (hasGemini) return 'gemini';
    }

    return 'fallback';
  }

  normalizeText(value) {
    return String(value || '').trim();
  }

  normalizeLanguage(value) {
    return this.normalizeText(value)
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ');
  }

  extractJsonPayload(rawText) {
    const text = this.normalizeText(rawText);
    if (!text) return null;

    const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fencedMatch?.[1]) {
      return fencedMatch[1].trim();
    }

    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return text.slice(firstBrace, lastBrace + 1);
    }

    return null;
  }

  parseJsonPayload(rawText) {
    const jsonCandidate = this.extractJsonPayload(rawText);
    if (!jsonCandidate) return null;

    try {
      return JSON.parse(jsonCandidate);
    } catch {
      return null;
    }
  }

  resolveTranslationProvider(preferred = 'gemini') {
    const requested = String(preferred || 'gemini').toLowerCase();
    const hasGemini = Boolean(this.geminiApiKey);
    const hasOpenAI = Boolean(this.openaiApiKey);

    if (requested === 'openai') {
      if (hasOpenAI) return 'openai';
      if (hasGemini) return 'gemini';
    } else {
      if (hasGemini) return 'gemini';
      if (hasOpenAI) return 'openai';
    }

    throw new Error(
      'No AI provider is configured for translation. Set GOOGLE_GEMINI_API_KEY or OPENAI_API_KEY.'
    );
  }

  buildTranslationPrompt(text, targetLanguage) {
    return `Analyze the job description and return ONLY valid JSON with this exact shape:
{
  "sourceLanguage": "<detected language name in English>",
  "sourceLanguageCode": "<ISO-639-1 lowercase code if known, else empty string>",
  "targetLanguage": "${targetLanguage}",
  "isTranslated": <true if translation was required, false if already target language>,
  "translatedText": "<translated description if isTranslated=true, otherwise original text unchanged>"
}

Rules:
- Do not add markdown, comments, or extra keys.
- Preserve technical terms, URLs, and numbers.
- Keep tone and meaning unchanged.

Job description:
"""
${text}
"""`;
  }

  normalizeTranslationResult(result, originalText, targetLanguage, provider) {
    const sourceLanguage = this.normalizeLanguage(
      result?.sourceLanguage || result?.detectedLanguage || ''
    );
    const sourceLanguageCode = this.normalizeText(
      result?.sourceLanguageCode || ''
    ).toLowerCase();
    const translatedText = this.normalizeText(result?.translatedText || '');
    const isTranslatedFlag = Boolean(result?.isTranslated);
    const isTranslated =
      isTranslatedFlag &&
      translatedText.length > 0 &&
      translatedText !== this.normalizeText(originalText);

    return {
      provider,
      sourceLanguage: sourceLanguage || null,
      sourceLanguageCode: sourceLanguageCode || null,
      targetLanguage: this.normalizeLanguage(targetLanguage) || targetLanguage,
      isTranslated,
      translatedText: isTranslated ? translatedText : originalText,
    };
  }

  async translateWithOpenAI(prompt) {
    const payload = {
      model: this.openaiModel,
      messages: [
        {
          role: 'system',
          content:
            'You are a translation assistant. Output strict JSON only, with no markdown.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 1500,
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
        const error = await response.json().catch(() => null);
        throw new Error(
          `OpenAI API Error: ${error?.error?.message || response.statusText}`
        );
      }

      const data = await response.json();
      return data?.choices?.[0]?.message?.content || '';
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Translation timed out', { cause: error });
      }
      throw error;
    }
  }

  async translateWithGemini(prompt) {
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
            text: 'You are a translation assistant. Output strict JSON only, with no markdown.',
          },
        ],
      },
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1500,
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
        const error = await response.json().catch(() => null);
        throw new Error(
          `Gemini API Error: ${error?.error?.message || response.statusText}`
        );
      }

      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Translation timed out', { cause: error });
      }
      throw error;
    }
  }

  async translateTextIfNeeded({ text, targetLanguage, aiService = 'gemini' }) {
    const sourceText = this.normalizeText(text);
    const target = this.normalizeLanguage(targetLanguage);

    if (!sourceText) {
      return {
        provider: 'none',
        sourceLanguage: null,
        sourceLanguageCode: null,
        targetLanguage: target || null,
        isTranslated: false,
        translatedText: '',
      };
    }

    if (!target) {
      return {
        provider: 'none',
        sourceLanguage: null,
        sourceLanguageCode: null,
        targetLanguage: null,
        isTranslated: false,
        translatedText: sourceText,
      };
    }

    const provider = this.resolveTranslationProvider(aiService);
    const prompt = this.buildTranslationPrompt(sourceText, target);

    const rawResult =
      provider === 'openai'
        ? await this.translateWithOpenAI(prompt)
        : await this.translateWithGemini(prompt);

    const parsed = this.parseJsonPayload(rawResult);

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Translation response is not valid JSON');
    }

    return this.normalizeTranslationResult(
      parsed,
      sourceText,
      target,
      provider
    );
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
      const provider = this.resolveProposalProvider(aiService);
      if (provider === 'fallback') {
        return this.getDefaultProposalResponse();
      }

      let proposal;

      if (provider === 'gemini') {
        proposal = await this.generateWithGemini(job, user, caseStudy);
      } else {
        proposal = await this.generateWithOpenAI(job, user, caseStudy);
      }

      if (!this.normalizeText(proposal)) {
        return this.getDefaultProposalResponse();
      }

      return proposal;
    } catch (error) {
      console.error(`Error generating proposal with ${aiService}:`, error);
      return this.getDefaultProposalResponse();
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
    const profileRate =
      user.jobPreferences?.rateType === 'hourly'
        ? `$${user.jobPreferences?.hourlyRate}/hour`
        : `$${user.jobPreferences?.fixedRate} fixed`;

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
Rate: ${profileRate}
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
