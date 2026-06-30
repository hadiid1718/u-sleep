import {
  OPENAI_API_KEY,
  OPENAI_MODEL,
  GOOGLE_GEMINI_API_KEY,
  GOOGLE_GEMINI_MODEL,
  PROPOSAL_GENERATION_TIMEOUT,
} from '../config/env.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const PROPOSAL_STYLE_VARIANTS = [
  {
    id: 'outcome-first',
    hook: 'Lead with the outcome and business impact the client wants.',
    proof: 'Use a metrics-first example with tools and measurable results.',
    approach: 'Frame the plan as milestones with fast validation checkpoints.',
  },
  {
    id: 'risk-first',
    hook: 'Open by naming the biggest risk and how you reduce it.',
    proof: 'Show a similar risk resolved with concrete methods and outcomes.',
    approach: 'Describe a risk-controlled delivery sequence with QA gates.',
  },
  {
    id: 'timeline-first',
    hook: 'Start with timeline pressure and how you keep it on track.',
    proof: 'Reference a delivery that hit a tight deadline with metrics.',
    approach: 'Lay out a short sprint plan and communication cadence.',
  },
  {
    id: 'quality-first',
    hook: 'Open with quality expectations and how you protect them.',
    proof: 'Describe a quality-focused project with tooling and results.',
    approach: 'Detail review loops, checkpoints, and acceptance criteria.',
  },
];

const PROPOSAL_MIN_WORDS = 170;
const PROPOSAL_MAX_WORDS = 230;
const PROPOSAL_MIN_SENTENCES_HOOK = 3;
const PROPOSAL_MIN_SENTENCES_PROOF = 3;
const PROPOSAL_MIN_SENTENCES_APPROACH = 2;

/**
 * AI Proposal Generation Service
 * Supports both OpenAI and Google Gemini
 */
class AIProposalService {
  constructor() {
    this.openaiApiKey = OPENAI_API_KEY;
    this.openaiModel = OPENAI_MODEL || 'gpt-4-turbo';
    this.geminiApiKey = GOOGLE_GEMINI_API_KEY;
    this.geminiModel = GOOGLE_GEMINI_MODEL || 'gemini-2.5-flash';
    this.geminiClient = this.geminiApiKey
      ? new GoogleGenerativeAI(this.geminiApiKey)
      : null;
    this.timeout = parseInt(PROPOSAL_GENERATION_TIMEOUT) || 30000;
    this.defaultProposalResponse = `Your project calls for clear requirements, fast execution, and a result that feels polished from day one. I can start with a quick scope pass and a short sample so you can confirm the direction before we scale the full delivery.

On a recent delivery, I used a tight review loop and versioned handoffs to reduce back-and-forth by 40% while keeping quality consistent. Another engagement required a focused milestone plan, which kept the rollout on schedule and avoided rework.

My approach is simple: clarify must-haves, ship an initial milestone quickly, and iterate with concise checkpoints so nothing drifts. If this matches what you need, are you open to a quick kickoff call or should I outline the first milestone today?`;
  }

  getDefaultProposalResponse(job = null, user = null) {
    if (job) {
      return this.buildFallbackProposal(job, user);
    }
    return this.defaultProposalResponse;
  }

  resolveProposalProvider(preferred = 'gemini') {
    const requested = String(preferred || 'gemini').toLowerCase();
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

  getProviderModel(provider) {
    const normalized = String(provider || '').toLowerCase();
    if (normalized === 'openai') return this.openaiModel;
    if (normalized === 'gemini') return this.geminiModel;
    return null;
  }

  normalizeText(value) {
    return String(value || '').trim();
  }

  truncateText(value, maxChars = 900) {
    const normalized = this.normalizeText(value);
    if (normalized.length <= maxChars) return normalized;
    return normalized.slice(0, maxChars).trim();
  }

  buildProposalVariation(job) {
    const seed = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const index = Math.floor(Math.random() * PROPOSAL_STYLE_VARIANTS.length);
    const variant = PROPOSAL_STYLE_VARIANTS[index];
    const jobKey = this.getJobMatchKey(job);

    return {
      seed,
      jobKey,
      variant,
      directive: `Variation seed: ${seed}. Style angle: ${variant.id}. Hook focus: ${variant.hook} Proof focus: ${variant.proof} Approach focus: ${variant.approach} Use distinct wording and sentence structure from any prior draft. Do not mention this seed.`,
    };
  }

  countWords(text) {
    return this.normalizeText(text).split(/\s+/).filter(Boolean).length;
  }

  countSentences(text) {
    return String(text || '')
      .split(/[.!?]+/)
      .map(sentence => sentence.trim())
      .filter(Boolean).length;
  }

  estimateTranslationTokens(text) {
    const normalized = this.normalizeText(text);
    if (!normalized) return 1500;

    const wordCount = this.countWords(normalized);
    const charCount = normalized.length;
    const estimated = Math.ceil(Math.max(wordCount * 2.2, charCount / 3));

    return Math.max(1500, Math.min(4096, estimated));
  }

  isProposalCompliant(text, user = null) {
    const normalized = this.normalizeText(text);
    if (!normalized) return false;

    const paragraphs = normalized.split(/\n\s*\n/).filter(Boolean);
    if (paragraphs.length !== 3) return false;

    const hookSentences = this.countSentences(paragraphs[0]);
    const proofSentences = this.countSentences(paragraphs[1]);
    const approachSentences = this.countSentences(paragraphs[2]);

    if (hookSentences < PROPOSAL_MIN_SENTENCES_HOOK) return false;
    if (proofSentences < PROPOSAL_MIN_SENTENCES_PROOF) return false;
    if (approachSentences < PROPOSAL_MIN_SENTENCES_APPROACH) return false;

    const wordCount = this.countWords(normalized);
    if (wordCount < PROPOSAL_MIN_WORDS || wordCount > PROPOSAL_MAX_WORDS) {
      return false;
    }

    const firstWord = normalized
      .split(/\s+/)[0]
      .replace(/[^a-zA-Z]/g, '')
      .toLowerCase();
    if (['hi', 'hello', 'i'].includes(firstWord)) return false;

    const userName = this.normalizeText(user?.name || '');
    if (userName) {
      const firstName = userName.split(/\s+/)[0].toLowerCase();
      if (firstName && firstWord === firstName) return false;
    }

    const lowered = normalized.toLowerCase();
    const bannedPhrases = [
      'i am the perfect candidate',
      'i would love to work with you',
      'passionate',
      'dedicated',
      'detail-oriented',
      'guru',
      'ninja',
      'rockstar',
    ];

    if (bannedPhrases.some(phrase => lowered.includes(phrase))) {
      return false;
    }

    return true;
  }

  extractRequirementSnippet(description) {
    const text = this.normalizeText(description);
    if (!text) return '';

    const lowered = text.toLowerCase();
    const markers = ['looking for', 'need', 'seeking', 'require', 'requires'];

    for (const marker of markers) {
      const idx = lowered.indexOf(marker);
      if (idx >= 0) {
        const slice = text.slice(idx + marker.length).trim();
        const words = slice.split(/\s+/).filter(Boolean).slice(0, 12);
        if (words.length > 0) {
          return words.join(' ');
        }
      }
    }

    const sentenceMatch = text.match(/([^.!?]{20,180})([.!?]|$)/);
    if (sentenceMatch?.[1]) {
      return sentenceMatch[1].trim();
    }

    return text.split(/\s+/).slice(0, 12).join(' ');
  }

  inferToolsFromText(text) {
    const normalized = this.normalizeText(text).toLowerCase();
    const tools = [];

    if (normalized.includes('capcut')) tools.push('CapCut');
    if (normalized.includes('premiere')) tools.push('Premiere Pro');
    if (normalized.includes('after effects')) tools.push('After Effects');
    if (normalized.includes('davinci')) tools.push('DaVinci Resolve');
    if (normalized.includes('figma')) tools.push('Figma');
    if (normalized.includes('react')) tools.push('React');
    if (normalized.includes('node')) tools.push('Node.js');

    return tools;
  }

  buildFallbackProposal(job = {}, _user = {}) {
    const title = this.normalizeText(job?.title) || 'your project';
    const description = this.normalizeText(
      job?.description || job?.shortDescription || ''
    );
    const skills = Array.isArray(job?.skills) ? job.skills.filter(Boolean) : [];
    const skillSnippet = skills.slice(0, 3).join(', ');
    const requirement = this.extractRequirementSnippet(description);
    const inferredTools = this.inferToolsFromText(
      `${skillSnippet} ${description}`
    );
    const toolPhrase =
      inferredTools.length > 0
        ? inferredTools.join(', ')
        : 'a structured workflow and focused review loops';

    const hook = `Your ${title} needs ${requirement || 'clear scope and fast execution'}${skillSnippet ? ` with ${skillSnippet}` : ''}, which tells me speed and quality both matter. I can start with a quick scope pass and a short sample so you can confirm the direction before we scale the full delivery.`;

    const proof = `On a recent ${skillSnippet || 'similar'} engagement, I used ${toolPhrase} to deliver a clean first milestone and cut review cycles by 40%. Another project required tight handoffs and versioned feedback, which kept turnaround under 48 hours without quality drift.`;

    const approach =
      'My approach here is simple: audit existing assets, define the first milestone with your must-have requirements, and run a tight review loop so we lock quality early. Then I execute in short sprints with clear checkpoints and handoff-ready files. If this aligns, are you open to a quick kickoff call or should I outline the first milestone today?';

    let proposal = `${hook}\n\n${proof}\n\n${approach}`;
    const wordCount = this.countWords(proposal);

    if (wordCount < 150) {
      const filler =
        'If you have brand references or examples you like, I can mirror the tone and pacing from the first draft.';
      proposal = `${hook}\n\n${proof}\n\n${approach.replace('If this aligns,', `${filler} If this aligns,`)}`;
    }

    return proposal;
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

    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    if (firstBracket >= 0 && lastBracket > firstBracket) {
      const slice = text.slice(firstBracket, lastBracket + 1);
      if (slice.includes('{')) {
        return slice;
      }
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
      const sanitized = jsonCandidate
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/\u2019/g, '\'')
        .replace(/,\s*([}\]])/g, '$1');

      if (sanitized === jsonCandidate) return null;

      try {
        return JSON.parse(sanitized);
      } catch {
        return null;
      }
    }
  }

  async withTimeout(promise, timeoutMessage) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error(timeoutMessage)),
        this.timeout
      );
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  getGeminiClient() {
    if (!this.geminiClient) {
      throw new Error(
        'Google Gemini is not configured. Set GOOGLE_GEMINI_API_KEY.'
      );
    }

    return this.geminiClient;
  }

  getGeminiModel(systemInstruction = null) {
    const client = this.getGeminiClient();
    return client.getGenerativeModel({
      model: this.geminiModel,
      ...(systemInstruction ? { systemInstruction } : {}),
    });
  }

  extractGeminiText(result) {
    if (!result?.response) return '';

    try {
      if (typeof result.response.text === 'function') {
        return result.response.text();
      }
    } catch {
      return '';
    }

    return result.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  async generateWithGeminiSdk({
    prompt,
    systemInstruction,
    generationConfig,
    timeoutMessage,
  }) {
    const model = this.getGeminiModel(systemInstruction);
    const request = model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig,
    });

    const result = await this.withTimeout(
      request,
      timeoutMessage || 'Gemini request timed out'
    );
    return this.extractGeminiText(result);
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

  async translateWithOpenAI(prompt, maxTokens = 1500) {
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
      max_tokens: maxTokens,
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

  async translateWithGemini(prompt, maxOutputTokens = 1500) {
    return this.generateWithGeminiSdk({
      prompt,
      systemInstruction:
        'You are a translation assistant. Output strict JSON only, with no markdown.',
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens,
        topP: 0.9,
        responseMimeType: 'application/json',
      },
      timeoutMessage: 'Translation timed out',
    });
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

    const maxOutputTokens = this.estimateTranslationTokens(sourceText);
    const rawResult =
      provider === 'openai'
        ? await this.translateWithOpenAI(prompt, maxOutputTokens)
        : await this.translateWithGemini(prompt, maxOutputTokens);

    const parsed = this.parseJsonPayload(rawResult);

    if (!parsed || typeof parsed !== 'object') {
      const fallbackText = this.normalizeText(rawResult);

      if (fallbackText) {
        return this.normalizeTranslationResult(
          {
            translatedText: fallbackText,
            isTranslated: true,
          },
          sourceText,
          target,
          provider
        );
      }

      return {
        provider,
        sourceLanguage: null,
        sourceLanguageCode: null,
        targetLanguage: target || null,
        isTranslated: false,
        translatedText: sourceText,
      };
    }

    return this.normalizeTranslationResult(
      parsed,
      sourceText,
      target,
      provider
    );
  }

  getJobMatchKey(job) {
    return String(
      job?.upworkJobId ||
        job?.freelancerJobId ||
        job?.sourceJobId ||
        job?._id ||
        job?.id ||
        ''
    ).trim();
  }

  summarizeJobForMatch(job) {
    const jobKey = this.getJobMatchKey(job);
    const title = this.normalizeText(job?.title);
    const description = this.normalizeText(job?.description)
      .slice(0, 500)
      .trim();
    const skills = Array.isArray(job?.skills) ? job.skills.slice(0, 8) : [];

    return {
      jobId: jobKey,
      title: title || 'Untitled job',
      description,
      skills,
      budgetType: job?.budgetType || null,
      budgetAmount: job?.budget?.amount ?? null,
      hourlyRateMin: job?.hourlyRate?.min ?? null,
      hourlyRateMax: job?.hourlyRate?.max ?? null,
      proposalsCount: job?.proposalsCount ?? null,
      clientRating: job?.clientInfo?.rating ?? null,
      clientPaymentVerified: Boolean(job?.clientInfo?.paymentVerified),
      clientCountry: job?.clientInfo?.country || null,
    };
  }

  buildJobMatchPrompt(preferences, jobs) {
    const normalizedPreferences = {
      keywords: Array.isArray(preferences?.keywords)
        ? preferences.keywords.filter(Boolean)
        : [],
      badJobCriteria: Array.isArray(preferences?.badJobCriteria)
        ? preferences.badJobCriteria.filter(Boolean)
        : [],
      rateType: preferences?.rateType || null,
      hourlyRate: preferences?.jobHourly ?? preferences?.hourlyRate ?? null,
      fixedRate:
        preferences?.projectFixedRate ?? preferences?.fixedRate ?? null,
      selectedRole: preferences?.selectedRole || preferences?.userRole || null,
      selectedPlatform: preferences?.selectedPlatform || null,
    };

    return `You are a job matching assistant. Return ONLY valid JSON.

User preferences (JSON):
${JSON.stringify(normalizedPreferences)}

Jobs to score (JSON array):
${JSON.stringify(jobs)}

For each job return an object with keys:
- jobId (string, must match input jobId)
- score (number 0-100)
- reasoning (short sentence)

Rules:
- Score reflects how well the job matches preferences.
- Give 80+ only for strong matches.
- Output ONLY the JSON array.`;
  }

  async generateJsonWithOpenAI(prompt, systemMessage) {
    const payload = {
      model: this.openaiModel,
      messages: [
        {
          role: 'system',
          content: systemMessage,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 1200,
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
      return data.choices?.[0]?.message?.content || '';
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Job scoring timed out', { cause: error });
      }
      throw error;
    }
  }

  async scoreJobsForPreferences({
    jobs = [],
    preferences = {},
    aiService = 'gemini',
    maxJobs = 25,
  } = {}) {
    if (!Array.isArray(jobs) || jobs.length === 0) return null;

    const provider = this.resolveProposalProvider(aiService);
    if (provider === 'fallback') return null;

    const trimmedJobs = jobs
      .filter(job => this.getJobMatchKey(job))
      .slice(0, maxJobs)
      .map(job => this.summarizeJobForMatch(job));

    if (trimmedJobs.length === 0) return null;

    const prompt = this.buildJobMatchPrompt(preferences, trimmedJobs);
    const systemMessage =
      'You are a job matching assistant. Output strict JSON only, no markdown.';

    const rawResult =
      provider === 'openai'
        ? await this.generateJsonWithOpenAI(prompt, systemMessage)
        : await this.generateWithGeminiSdk({
          prompt,
          systemInstruction: systemMessage,
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1200,
            topP: 0.9,
          },
          timeoutMessage: 'Job scoring timed out',
        });

    const parsed = this.parseJsonPayload(rawResult);
    if (!Array.isArray(parsed)) return null;

    const scores = new Map();

    for (const item of parsed) {
      const jobId = this.normalizeText(item?.jobId || item?.id);
      if (!jobId) continue;
      const score = Number(item?.score ?? item?.matchScore ?? 0);
      const clampedScore = Number.isFinite(score)
        ? Math.max(0, Math.min(100, score))
        : 0;
      const reasoning = this.normalizeText(
        item?.reasoning || item?.reason || item?.notes || ''
      );

      scores.set(jobId, { score: clampedScore, reasoning });
    }

    return scores.size > 0 ? scores : null;
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
    const {
      aiService = 'gemini',
      job,
      user,
      caseStudy,
      previousProposal = '',
    } = params;

    if (!job || !user) {
      throw new Error('Job and user details are required');
    }

    try {
      const provider = this.resolveProposalProvider(aiService);
      if (provider === 'fallback') {
        const error = new Error(
          'No AI provider is configured for proposal generation. Set GOOGLE_GEMINI_API_KEY or OPENAI_API_KEY.'
        );
        error.code = 'AI_PROVIDER_NOT_CONFIGURED';
        throw error;
      }

      const variation = this.buildProposalVariation(job);
      const priorDraft = this.normalizeText(previousProposal);

      let proposal;

      if (provider === 'gemini') {
        proposal = await this.generateWithGemini(job, user, caseStudy, {
          variation,
          previousProposal: priorDraft,
        });
      } else {
        proposal = await this.generateWithOpenAI(job, user, caseStudy, {
          variation,
          previousProposal: priorDraft,
        });
      }

      if (!this.normalizeText(proposal)) {
        const error = new Error('AI returned an empty proposal response.');
        error.code = 'AI_EMPTY_RESPONSE';
        throw error;
      }

      if (this.isProposalCompliant(proposal, user)) {
        return proposal;
      }

      const repaired = await this.rewriteProposalToComply({
        rawProposal: proposal,
        job,
        user,
        caseStudy,
        aiService: provider,
        variation,
        previousProposal: priorDraft,
      });

      if (this.isProposalCompliant(repaired, user)) {
        return repaired;
      }

      const retryVariation = this.buildProposalVariation(job);
      const retry =
        provider === 'gemini'
          ? await this.generateWithGemini(job, user, caseStudy, {
            variation: retryVariation,
            previousProposal: priorDraft,
          })
          : await this.generateWithOpenAI(job, user, caseStudy, {
            variation: retryVariation,
            previousProposal: priorDraft,
          });

      if (this.isProposalCompliant(retry, user)) {
        return retry;
      }

      const error = new Error(
        'AI proposal did not meet length or format requirements.'
      );
      error.code = 'AI_NON_COMPLIANT';
      throw error;
    } catch (error) {
      console.error(`Error generating proposal with ${aiService}:`, error);
      throw error;
    }
  }

  /**
   * Generate proposal using OpenAI
   */
  async generateWithOpenAI(job, user, caseStudy, options = {}) {
    const prompt = this.buildPrompt(job, user, caseStudy, options);
    const platform =
      job?.source === 'freelancer_api' ? 'Freelancer.com' : 'Upwork';

    const payload = {
      model: this.openaiModel,
      messages: [
        {
          role: 'system',
          content: `You are an expert ${platform} proposal writer. Write COMPREHENSIVE, DETAILED proposals.
Constraints:
- 3 paragraphs, separated by a blank line.
- Target 180-200 words total (aim for closer to 200, not shorter).
- First word must NOT be "Hi", "Hello", "I", or the freelancer's name.
- Paragraph 1: 3-4 sentences opening with a specific client problem or goal.
- Paragraph 2: 3-4 sentences with concrete past project examples, tools/methods, and measurable outcomes.
- Paragraph 3: 2-3 sentences describing your approach/process, ending with ONE smart question or confident call to action.
- Tone: conversational, direct, client-focused. No fluff.
- Do not restate the job description; reference specifics once with depth.
- Avoid banned phrases: "I am the perfect candidate", "I would love to work with you", "passionate", "dedicated", "detail-oriented", "guru", "ninja", "rockstar".
- Output ONLY the proposal text - write in full detail.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 1.0,
      max_tokens: 2000,
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
  async generateWithGemini(job, user, caseStudy, options = {}) {
    const prompt = this.buildPrompt(job, user, caseStudy, options);
    const platform =
      job?.source === 'freelancer_api' ? 'Freelancer.com' : 'Upwork';
    return this.generateWithGeminiSdk({
      prompt,
      systemInstruction: `You are an expert ${platform} proposal writer. Write COMPREHENSIVE, DETAILED proposals.
    Constraints:
    - 3 paragraphs, separated by a blank line.
    - Target 180-200 words total (aim for closer to 200, not shorter).
    - First word must NOT be "Hi", "Hello", "I", or the freelancer's name.
    - Paragraph 1: 3-4 sentences opening with a specific client problem or goal.
    - Paragraph 2: 3-4 sentences with concrete past project examples, tools/methods, and measurable outcomes.
    - Paragraph 3: 2-3 sentences describing your approach/process, ending with ONE smart question or confident call to action.
    - Tone: conversational, direct, client-focused. No fluff.
    - Do not restate the job description; reference specifics once with depth.
    - Avoid banned phrases: "I am the perfect candidate", "I would love to work with you", "passionate", "dedicated", "detail-oriented", "guru", "ninja", "rockstar".
    - Output ONLY the proposal text - write in full detail.`,
      generationConfig: {
        temperature: 1.0,
        maxOutputTokens: 2000,
        topP: 0.9,
      },
      timeoutMessage: 'Proposal generation timed out',
    });
  }

  /**
   * Build proposal prompt
   */
  buildPrompt(job, user, caseStudy, options = {}) {
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
    const clientName = this.normalizeText(job?.clientInfo?.name || '');

    const variation = options?.variation || null;
    const previousProposal = this.truncateText(
      options?.previousProposal || '',
      900
    );
    const variationDirective = variation?.directive
      ? `\n11. Variation: ${variation.directive}`
      : '';

    let prompt = `Generate a professional ${platform} proposal for the following job:

**JOB DETAILS:**
Title: ${job.title}
Description: ${job.description}
Budget: ${job.budgetType === 'fixed' ? `Fixed $${job.budget?.amount}` : `Hourly $${job.hourlyRate?.min}-${job.hourlyRate?.max}`}
Skills Required: ${job.skills?.join(', ') || 'N/A'}
Client Name: ${clientName || 'Unknown'}
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
1. Use the job details and description; reference a specific requirement from the job.
2. Output exactly 3 paragraphs separated by a blank line.
3. Word count MUST be between 180-200 words total. Aim for closer to 200. Write a comprehensive proposal, not a short one.
4. Paragraph 1 (Hook): start with the client's problem/goal (3-4 sentences); first word must NOT be "Hi", "Hello", "I", or the freelancer's name. Be specific about their challenge.
5. Paragraph 2 (Proof): give 1-2 concrete past projects with tools/methods and measurable outcomes (3-4 sentences). Include specific results and what made them successful.
6. Paragraph 3 (Approach + CTA): 2-3 sentences on how you'll solve THIS job, your process, and timeline, then end with ONE specific question or direct call to action.
7. Tone: conversational, direct, client-focused. No fluff. Do not restate the job description.
8. Each paragraph should be detailed and substantive - minimum 3 sentences each. Provide depth and specifics.
9. Avoid banned phrases: "I am the perfect candidate", "I would love to work with you", "passionate", "dedicated", "detail-oriented", "guru", "ninja", "rockstar".
10. No subject line, no greeting, no labels, no placeholders. Output ONLY the full proposal text - aim for 190-200 words.${variationDirective}`;

    if (previousProposal) {
      prompt += `

**PREVIOUS DRAFT (avoid reusing phrasing or sentence structure):**
"""
${previousProposal}
"""`;
    }

    if (caseStudy) {
      prompt += `

**CASE STUDY TO INCORPORATE:**
${caseStudy}

Use this case study as the Proof paragraph. Keep it concrete with tools/methods and measurable outcomes.`;
    }

    return prompt;
  }

  buildComplianceRewritePrompt({
    rawProposal,
    job,
    user,
    caseStudy,
    variation,
    previousProposal,
  }) {
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
    const clientName = this.normalizeText(job?.clientInfo?.name || '');
    const sanitizedDraft = this.truncateText(rawProposal, 1200);
    const priorDraft = this.truncateText(previousProposal, 900);
    const variationDirective = variation?.directive
      ? `\nVARIATION DIRECTIVE (do not mention explicitly): ${variation.directive}`
      : '';

    let prompt = `Rewrite the proposal to fully comply with the constraints below. Keep the facts aligned with the job and profile but rewrite all phrasing and sentence structure.

JOB DETAILS:
Title: ${job.title}
Description: ${job.description}
Budget: ${job.budgetType === 'fixed' ? `Fixed $${job.budget?.amount}` : `Hourly $${job.hourlyRate?.min}-${job.hourlyRate?.max}`}
Skills Required: ${job.skills?.join(', ') || 'N/A'}
Client Name: ${clientName || 'Unknown'}
Client Rating: ${job.clientInfo?.rating || 'N/A'}
Proposals Received: ${job.proposalsCount || 'N/A'}

FREELANCER PROFILE:
Name: ${user.name}
Role: ${user.jobPreferences?.userRole || 'Freelancer'}
Rate: ${profileRate}
Platform: ${platform}
Profile URL: ${profileUrl}
Keywords/Expertise: ${user.jobPreferences?.keywords?.join(', ') || 'N/A'}

EXISTING DRAFT (rewrite; do not reuse phrasing):
"""
${sanitizedDraft}
"""

CONSTRAINTS:
- 3 paragraphs separated by a blank line.
- 180-200 words total (target 190-200).
- Paragraph 1: 3-4 sentences hook with the client's specific problem or goal.
- Paragraph 2: 3-4 sentences proof with concrete past project(s), tools, and measurable outcomes.
- Paragraph 3: 2-3 sentences approach + CTA; end with ONE specific question or confident call to action.
- First word must NOT be "Hi", "Hello", "I", or the freelancer's name.
- Tone: conversational, direct, client-focused. No fluff.
- Do not restate the job description; reference specifics once with depth.
- Avoid banned phrases: "I am the perfect candidate", "I would love to work with you", "passionate", "dedicated", "detail-oriented", "guru", "ninja", "rockstar".
- No subject line, no greeting, no labels, no placeholders. Output ONLY the full proposal text.`;

    if (priorDraft) {
      prompt += `

PREVIOUS DRAFT (avoid reusing phrases or sentence structure):
"""
${priorDraft}
"""`;
    }

    if (caseStudy) {
      prompt += `

CASE STUDY TO INCORPORATE AS PROOF:
${caseStudy}
Use this case study for the proof paragraph with tools/methods and measurable outcomes.`;
    }

    if (variationDirective) {
      prompt += `
${variationDirective}`;
    }

    return prompt;
  }

  async rewriteProposalToComply({
    rawProposal,
    job,
    user,
    caseStudy,
    aiService = 'gemini',
    variation = null,
    previousProposal = '',
  }) {
    const provider = this.resolveProposalProvider(aiService);
    if (provider === 'fallback') {
      throw new Error(
        'No AI provider is configured for proposal generation. Set GOOGLE_GEMINI_API_KEY or OPENAI_API_KEY.'
      );
    }

    const prompt = this.buildComplianceRewritePrompt({
      rawProposal,
      job,
      user,
      caseStudy,
      variation,
      previousProposal,
    });
    const systemInstruction =
      'You are an expert proposal editor. Output only the rewritten proposal text and enforce the constraints strictly.';

    if (provider === 'openai') {
      const payload = {
        model: this.openaiModel,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1400,
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
          throw new Error('Proposal rewrite timed out', { cause: error });
        }
        throw error;
      }
    }

    return this.generateWithGeminiSdk({
      prompt,
      systemInstruction,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
        topP: 0.9,
      },
      timeoutMessage: 'Proposal rewrite timed out',
    });
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
    const platform =
      job?.source === 'freelancer_api' ? 'Freelancer.com' : 'Upwork';
    const description = this.normalizeText(
      job?.description || job?.shortDescription || ''
    );
    const skills = Array.isArray(job?.skills) ? job.skills.filter(Boolean) : [];
    const budget =
      job?.budgetType === 'fixed'
        ? `Fixed $${job?.budget?.amount || 'N/A'}`
        : `Hourly $${job?.hourlyRate?.min || 'N/A'}-${
          job?.hourlyRate?.max || 'N/A'
        }`;
    const clientName = this.normalizeText(job?.clientInfo?.name || 'Unknown');
    const normalizedProposal = this.normalizeText(proposal);
    const normalizedCaseStudy = this.normalizeText(caseStudy);

    const upgradePrompt = `You are upgrading a ${platform} proposal. Keep the core intent of the existing proposal and the job context. The case study must be the Proof paragraph, but do NOT make the response only about the case study.

JOB DETAILS:
Title: ${this.normalizeText(job?.title) || 'N/A'}
Description: ${description || 'N/A'}
Skills: ${skills.length ? skills.join(', ') : 'N/A'}
Budget: ${budget}
Client: ${clientName}

EXISTING PROPOSAL:
"""
${normalizedProposal || 'N/A'}
"""

CASE STUDY:
"""
${normalizedCaseStudy || 'N/A'}
"""

INSTRUCTIONS:
- Rewrite to exactly 3 paragraphs separated by a blank line
- Target 180-200 words total. Aim for closer to 200 words with comprehensive detail.
- Paragraph 1 is the Hook (3-4 sentences): must reference at least one specific job detail from JOB DETAILS with depth
- Paragraph 2 is Proof (3-4 sentences): use the CASE STUDY with tools/methods and specific measurable outcomes
- Paragraph 3 is Approach (3-4 sentences): describe your process for solving THIS job and outcome, then end with ONE smart question or confident call to action
- Each paragraph must be detailed and substantive - 3-4 sentences each
- No subject line, no greeting, no labels, no placeholders
- Avoid banned phrases: "I am the perfect candidate", "I would love to work with you", "passionate", "dedicated", "detail-oriented", "guru", "ninja", "rockstar"
- Output ONLY the full proposal text - aim for 190-200 words`;

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
            'You are an expert proposal editor. Enforce a 3-paragraph, 150-220 word response with a hook, proof using the case study, and an approach ending with one question or CTA. No greetings, no labels, no placeholders.',
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
    return this.generateWithGeminiSdk({
      prompt: upgradePrompt,
      systemInstruction:
        'You are an expert proposal editor. Enforce a 3-paragraph, 150-220 word response with a hook, proof using the case study, and an approach ending with one question or CTA. No greetings, no labels, no placeholders.',
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2000,
      },
      timeoutMessage: 'Proposal upgrade timed out',
    });
  }

  /**
   * Generate a short support reply for a user message using configured AI providers.
   * Returns plain text. Throws on failure.
   */
  async generateChatReply({
    message,
    aiService = 'gemini',
    maxTokens = 400,
  } = {}) {
    const provider = this.resolveProposalProvider(aiService);
    if (provider === 'fallback') {
      throw new Error('No AI provider configured for chat replies');
    }

    const systemInstruction = `You are a concise, professional product support assistant.
Respond helpfully and directly. Prioritize clarity and actionable steps. If the user's question is about billing, subscriptions or payments include next steps and links. If it is a systems/architecture question, keep the explanation high-level and user-friendly. If the question is purely out-of-scope for product support, respond with a short sentence that starts with "OUT_OF_CONTEXT:" followed by a brief suggestion to contact human support.
Limit your answer to roughly 2-6 short paragraphs and keep it under ${maxTokens} tokens.`;

    const prompt = String(message || '').trim();
    if (!prompt) return '';

    if (provider === 'openai') {
      const payload = {
        model: this.openaiModel,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: Math.min(800, maxTokens),
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
          const body = await response.json().catch(() => null);
          throw new Error(
            `OpenAI Error: ${body?.error?.message || response.statusText}`
          );
        }

        const data = await response.json();
        return this.normalizeText(data.choices?.[0]?.message?.content || '');
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    }

    // Gemini path
    const raw = await this.generateWithGeminiSdk({
      prompt,
      systemInstruction,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: Math.min(1024, Math.floor(maxTokens * 2)),
        topP: 0.9,
      },
      timeoutMessage: 'Gemini chat reply timed out',
    });

    return this.normalizeText(raw || '');
  }

  /**
   * Generate chat reply with provider failover (Gemini -> OpenAI by default).
   * Returns both reply text and provider used.
   */
  async generateChatReplyWithFallback({
    message,
    preferred = 'gemini',
    maxTokens = 400,
  } = {}) {
    const first =
      String(preferred || 'gemini').toLowerCase() === 'openai'
        ? 'openai'
        : 'gemini';
    const second = first === 'gemini' ? 'openai' : 'gemini';

    const attempts = [first, second];
    let lastError = null;

    for (const provider of attempts) {
      try {
        const text = await this.generateChatReply({
          message,
          aiService: provider,
          maxTokens,
        });
        if (text) {
          return { text, provider };
        }
      } catch (error) {
        lastError = error;
      }
    }

    throw (
      lastError ||
      new Error('Unable to generate chat reply from configured AI providers')
    );
  }
}

export default new AIProposalService();
