import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const AI_PROVIDER = process.env.AI_PROVIDER || 'none';

let openaiClient = null;
let geminiClient = null;

function getOpenAIClient() {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openaiClient;
}

function getGeminiClient() {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return geminiClient;
}

export function getAIProvider() {
  if (AI_PROVIDER === 'openai') {
    return new OpenAIEvaluator();
  } else if (AI_PROVIDER === 'gemini') {
    return new GeminiEvaluator();
  } else {
    return new DummyEvaluator();
  }
}

class OpenAIEvaluator {
  async evaluate(systemPrompt, userPrompt) {
    const client = getOpenAIClient();
    if (!client) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const content = response.choices[0].message.content;
      const parsed = JSON.parse(content);
      return parsed;
    } catch (err) {
      console.error('OpenAI error:', err);
      throw err;
    }
  }
}

class GeminiEvaluator {
  async evaluate(systemPrompt, userPrompt) {
    const client = getGeminiClient();
    if (!client) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const model = client.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-pro'
      });

      const response = await model.generateContent(
        `${systemPrompt}\n\n${userPrompt}`
      );

      const content = response.response.text();
      const parsed = JSON.parse(content);
      return parsed;
    } catch (err) {
      console.error('Gemini error:', err);
      throw err;
    }
  }
}

class DummyEvaluator {
  async evaluate(systemPrompt, userPrompt) {
    console.warn('No AI provider configured. Using dummy responses.');

    // Simple heuristic-based responses
    const lowerPrompt = userPrompt.toLowerCase();

    if (lowerPrompt.includes('nikhil') && lowerPrompt.includes('guilty')) {
      return {
        response: 'That conclusion requires more evidence. What specific evidence connects Nikhil to the fatal event?',
        strength: 'unsupported',
        supportedEvidence: [],
        deductionCandidates: [],
        reasoning: 'Accusation without sufficient evidence'
      };
    }

    if (lowerPrompt.includes('left') && lowerPrompt.includes('house')) {
      return {
        response: 'Your timeline argument is supported by the available evidence. This substantially weakens the direct involvement theory.',
        strength: 'strong',
        supportedEvidence: ['E017'],
        deductionCandidates: ['D001'],
        reasoning: 'Timeline and CCTV confirm departure before fatal event'
      };
    }

    if (lowerPrompt.includes('device') || lowerPrompt.includes('digital')) {
      return {
        response: 'You are beginning to understand the technological dimension. Who would have the knowledge and access to manipulate such a system?',
        strength: 'partial',
        supportedEvidence: [],
        deductionCandidates: [],
        reasoning: 'Correct direction but insufficient specificity'
      };
    }

    return {
      response: 'Interesting observation. What evidence supports that conclusion? You should examine the discovered materials more carefully.',
      strength: 'weak',
      supportedEvidence: [],
      deductionCandidates: [],
      reasoning: 'General guidance needed'
    };
  }
}
