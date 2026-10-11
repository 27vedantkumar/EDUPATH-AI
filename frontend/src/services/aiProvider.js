/**
 * EduPath AI — Modular AI Provider Abstraction & Long-Conversation Context Manager
 *
 * Architecture:
 * AIProvider
 *   ├── LocalAIProvider (Self-hosted Ollama/vLLM/LM Studio compatible + Embedded Local Knowledge Engine)
 *   ├── GeminiCompatibleProvider
 *   └── OpenAICompatibleProvider
 *
 * Principles:
 * - Zero application-level token/credit/message/question quotas or expiration timers.
 * - Intelligent context window management for long-running conversations (Recent + Relevant + Summary + RAG).
 * - Clean external provider failure message: "**AI service temporarily unavailable**" (never fake token exhaustion).
 */

import { ContentSanitizer } from './contentSanitizer.js';

export const PROVIDER_ERROR_MESSAGE = '**AI service temporarily unavailable**\n\nThe external language model endpoint could not be reached right now. Please try again in a moment or switch to the Local AI Provider.';

/**
 * Manages arbitrarily long conversation histories without ever exposing token limits
 * or deleting user history. Summarizes older turns and retrieves relevant prior context.
 */
export class ConversationContextManager {
  static MAX_RECENT_MESSAGES = 8;
  static MAX_RELEVANT_OLDER = 4;

  static buildManagedContext(conversationHistory = [], currentQuery = '', uploadedMaterialChunks = []) {
    const validMessages = Array.isArray(conversationHistory)
      ? conversationHistory.filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
      : [];

    const totalMessages = validMessages.length;
    const recentMessages = validMessages.slice(-this.MAX_RECENT_MESSAGES);
    const olderMessages = validMessages.slice(0, Math.max(0, totalMessages - this.MAX_RECENT_MESSAGES));

    // Summarize older turns if conversation is long
    let conversationSummary = '';
    let relevantOlderMessages = [];

    if (olderMessages.length > 0) {
      const discussedTopics = new Set();
      const userQuestions = [];

      for (const msg of olderMessages) {
        if (msg.role === 'user') {
          userQuestions.push(msg.content.slice(0, 90));
        }
        if (msg.pipeline_trace?.topic) {
          discussedTopics.add(msg.pipeline_trace.topic);
        }
        if (msg.pipeline_trace?.concept) {
          discussedTopics.add(msg.pipeline_trace.concept);
        }
      }

      const queryTerms = String(currentQuery || '')
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 3);

      if (queryTerms.length > 0) {
        relevantOlderMessages = olderMessages
          .filter((msg) => {
            const lower = msg.content.toLowerCase();
            return queryTerms.some((term) => lower.includes(term));
          })
          .slice(-this.MAX_RELEVANT_OLDER);
      }

      const topicsList = Array.from(discussedTopics).slice(0, 6).join(', ') || 'General Computer Science & Course Concepts';
      const sampleQuestions = userQuestions.slice(-4).join(' | ');
      conversationSummary = `Earlier in this session (${olderMessages.length} prior messages), the learner explored: ${topicsList}. Prior questions included: ${sampleQuestions}.`;
    }

    // Extract active subject from most recent turns for seamless follow-up resolution
    let lastActiveTopic = '';
    let lastAssistantExplanation = '';
    for (let i = validMessages.length - 1; i >= 0; i--) {
      const m = validMessages[i];
      if (!lastAssistantExplanation && m.role === 'assistant' && m.id !== 'welcome') {
        lastAssistantExplanation = m.content;
      }
      if (!lastActiveTopic && m.pipeline_trace?.concept && m.id !== 'welcome') {
        lastActiveTopic = m.pipeline_trace.concept;
      }
      if (!lastActiveTopic && m.role === 'user') {
        const cleaned = m.content.trim();
        if (cleaned.length > 4 && !/^(explain that|give me an|another|more simply|quiz me|why|how about)/i.test(cleaned)) {
          lastActiveTopic = cleaned;
        }
      }
    }

    return {
      totalMessages,
      recentMessages,
      relevantOlderMessages,
      conversationSummary,
      lastActiveTopic: lastActiveTopic || 'Operating Systems & Computer Science Fundamentals',
      lastAssistantExplanation,
      relevantMaterialCount: Array.isArray(uploadedMaterialChunks) ? uploadedMaterialChunks.length : 0
    };
  }
}

export class BaseAIProvider {
  constructor(name) {
    this.name = name;
  }

  async generate({ query, context, mode, responseDepth }) {
    throw new Error('generate() must be implemented by subclass');
  }
}

export class LocalAIProvider extends BaseAIProvider {
  constructor(config = {}) {
    super('LocalAIProvider');
    this.localEndpoint = config.localEndpoint || null; // Optional Ollama / LM Studio / vLLM URL
  }

  async generate({ query, context, mode = 'beginner', responseDepth = 'explanation', fallbackSynthesizer }) {
    if (this.localEndpoint) {
      try {
        const res = await fetch(this.localEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: query,
            context_summary: context?.conversationSummary || '',
            mode,
            depth: responseDepth
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.response || data?.content) {
            return {
              ok: true,
              provider: this.name,
              content: ContentSanitizer.cleanText(data.response || data.content)
            };
          }
        }
      } catch (_) {
        // Fall through to embedded local reasoning engine
      }
    }

    if (typeof fallbackSynthesizer === 'function') {
      const result = fallbackSynthesizer({ query, context, mode, responseDepth });
      return {
        ok: true,
        provider: this.name,
        ...result
      };
    }

    return {
      ok: true,
      provider: this.name,
      content: ContentSanitizer.cleanText(`**${query}**\n\nHere is a clear explanation based on your learning context.`)
    };
  }
}

export class OpenAICompatibleProvider extends BaseAIProvider {
  constructor(config = {}) {
    super('OpenAICompatibleProvider');
    this.apiKey = config.apiKey || '';
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1/chat/completions';
    this.model = config.model || 'gpt-4o-mini';
  }

  async generate({ query, systemPrompt = 'You are an expert AI educator.' }) {
    if (!this.apiKey) {
      return { ok: false, provider: this.name, error: PROVIDER_ERROR_MESSAGE };
    }
    try {
      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ]
        })
      });
      if (!res.ok) {
        return { ok: false, provider: this.name, error: PROVIDER_ERROR_MESSAGE };
      }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || '';
      return { ok: true, provider: this.name, content: ContentSanitizer.cleanText(text) };
    } catch (_) {
      return { ok: false, provider: this.name, error: PROVIDER_ERROR_MESSAGE };
    }
  }
}

export class GeminiCompatibleProvider extends BaseAIProvider {
  constructor(config = {}) {
    super('GeminiCompatibleProvider');
    this.apiKey = config.apiKey || '';
    this.model = config.model || 'gemini-2.5-flash';
  }

  async generate({ query, systemPrompt = 'You are an expert AI educator.' }) {
    if (!this.apiKey) {
      return { ok: false, provider: this.name, error: PROVIDER_ERROR_MESSAGE };
    }
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${query}` }] }]
        })
      });
      if (!res.ok) {
        return { ok: false, provider: this.name, error: PROVIDER_ERROR_MESSAGE };
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return { ok: true, provider: this.name, content: ContentSanitizer.cleanText(text) };
    } catch (_) {
      return { ok: false, provider: this.name, error: PROVIDER_ERROR_MESSAGE };
    }
  }
}

export class AIProviderRouter {
  constructor() {
    this.localProvider = new LocalAIProvider();
    this.geminiProvider = new GeminiCompatibleProvider();
    this.openaiProvider = new OpenAICompatibleProvider();
    this.activeProviderName = 'LocalAIProvider';
  }

  /**
   * Simulates or handles external provider status cleanly without ever exposing token/credit errors.
   */
  formatExternalProviderError() {
    return {
      answer: PROVIDER_ERROR_MESSAGE,
      brief_content: PROVIDER_ERROR_MESSAGE,
      explanation_content: PROVIDER_ERROR_MESSAGE,
      status: 'PROVIDER_UNAVAILABLE',
      source_origin: 'System Reliability Notice'
    };
  }
}

export const aiProviderRouter = new AIProviderRouter();
