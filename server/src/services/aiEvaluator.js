import { getDb } from '../database/init.js';
import { getAIProvider } from './aiProvider.js';

const SYSTEM_PROMPT = `You are an intelligent investigator/judge evaluating a participant's defense and investigation in a murder case.

CASE SUMMARY:
The victim is Meera Krishnan. The participant is playing Meera's husband and is initially the primary suspect.

ACTUAL CULPRIT: Nikhil Varma (CS student, cybersecurity specialist)

CASE CHAIN:
1. Raghav's theft operation (missing electronic shipments)
2. Meera discovers and investigates
3. Raghav attempts to silence Meera
4. Ananya (daughter) discovers Meera and Raghav's affair
5. Ananya plans to scare Meera with help from Rahul (her boyfriend)
6. Rahul searches for medical device info, finds Nikhil's research
7. Nikhil sees the opportunity and hijacks the scare
8. Nikhil sabotages the plan, causing a fatal event
9. The husband is initially blamed but is innocent

YOUR ROLE:
1. Evaluate whether the participant's arguments are supported by evidence they've discovered
2. Point out contradictions with known facts
3. Guide them toward discovering deeper layers without spoiling
4. Assess the strength of their reasoning
5. Do NOT reveal that Nikhil is the killer unless they've discovered sufficient evidence

IMPORTANT:
- Only treat evidence as valid if the participant has discovered it (you will be told which evidence they've discovered)
- Do not confirm accusations without sufficient evidence
- Teach logical reasoning (motive ≠ guilt, circumstantial evidence ≠ proof)
- If they ask "Who killed Meera?" without evidence, guide them to discover more
- Respond in a professional, investigator-like tone
- Be conversational but serious`;

export async function evaluateDefense(message, caseContext) {
  try {
    const provider = getAIProvider();

    const evaluationPrompt = `
PARTICIPANT'S DISCOVERED EVIDENCE:
${caseContext.discoveredEvidence.map(e => `- ${e.id}: ${e.title}`).join('\n')}

ESTABLISHED DEDUCTIONS:
${caseContext.establishedDeductions.map(d => `- ${d.id}: ${d.title}`).join('\n')}

CASE STATE:
- Current Guilt: ${caseContext.guilt}%
- Suspect Confidence: ${JSON.stringify(caseContext.suspectConfidence)}

PARTICIPANT'S MESSAGE:
"${message}"

TASK:
1. Evaluate whether their statement is supported by evidence
2. Identify if they're making a logical leap
3. Suggest what deduction they might be establishing (if any)
4. Respond in character as the investigator

Respond with JSON:
{
  "response": "Your response to the participant",
  "strength": "strong|partial|weak|unsupported",
  "supportedEvidence": ["E001", ...],
  "contradictedEvidence": ["E002", ...],
  "deductionCandidates": ["D01", ...],
  "reasoning": "Brief explanation of your evaluation"
}`;

    const response = await provider.evaluate(SYSTEM_PROMPT, evaluationPrompt);
    return response;
  } catch (err) {
    console.error('AI evaluation error:', err);

    // Fallback response
    return {
      response: 'The investigator is temporarily unavailable. Your evidence and investigation state are safe. Please try again.',
      strength: 'unknown',
      supportedEvidence: [],
      deductionCandidates: []
    };
  }
}

export function getDefenseEvaluation(message, caseContext) {
  // Deterministic evaluation for testing
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('left') && lowerMessage.includes('house')) {
    return {
      strength: 'strong',
      supportedEvidence: ['E017'],
      deductionCandidates: ['D001'],
      reasoning: 'Timeline and CCTV evidence supports departure before fatal event'
    };
  }

  if (lowerMessage.includes('digital') || lowerMessage.includes('device')) {
    return {
      strength: 'partial',
      supportedEvidence: [],
      deductionCandidates: ['D003'],
      reasoning: 'You are on the right track. Consider the infrastructure involved.'
    };
  }

  if (lowerMessage.includes('nikhil') || lowerMessage.includes('murder')) {
    return {
      strength: 'partial',
      supportedEvidence: [],
      deductionCandidates: [],
      reasoning: 'You need more evidence to establish this connection.'
    };
  }

  return {
    strength: 'weak',
    supportedEvidence: [],
    deductionCandidates: [],
    reasoning: 'Insufficient evidence to support this conclusion.'
  };
}
