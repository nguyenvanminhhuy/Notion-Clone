import type { AIOptionType } from '../types/ai';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MOCK_RESPONSES: Record<AIOptionType, (text?: string, prompt?: string) => string> = {
  summarize: (text) =>
    `**Key Takeaways:**\n- ${text ? text.slice(0, 80) : 'The main topics covered include project planning, team alignment, and milestone execution.'}\n- Key priorities focus on efficiency, accessibility, and clean architectural design.\n- Next steps involve finalizing feature verification and UX polishing.`,
  improve: (text) =>
    text
      ? `Here is an improved version:\n\n"${text.trim()} — revised for clarity, punchiness, and professional tone."`
      : 'Here is a refined version of your notes with enhanced structure and concise phrasing for maximum impact.',
  rewrite: (text) =>
    text
      ? `Rephrased:\n\n${text.split('. ').map((s) => `• ${s}`).join('\n')}`
      : 'Reorganized content with clearer paragraph transitions and bulleted executive highlights.',
  translate: (text, prompt) => {
    const lang = prompt?.toLowerCase().includes('vietnamese') ? 'Vietnamese' : prompt?.toLowerCase().includes('french') ? 'French' : 'Spanish';
    return `**[Translated to ${lang}]**\n\n${text || 'This content has been accurately translated into the selected target language while preserving original context and nuance.'}`;
  },
  explain: (text) =>
    `**Explanation:**\n\nThis section discusses ${text ? `"${text.slice(0, 50)}..."` : 'the core operational workflow'}. In simple terms, it breaks down how components interact, handle events, and sync state across the system without unnecessary overhead.`,
  continue: (text) =>
    `${text ? text + ' ' : ''}Furthermore, continuing this thought leads us to consider scalable scalability patterns, automated testing frameworks, and continuous delivery pipelines to ensure long-term stability.`,
  make_longer: (text) =>
    `In-depth Breakdown:\n\n${text || 'Initial summary context'}\n\nTo elaborate further on this point, standard enterprise workflows require thorough documentation, edge-case coverage, and clear user guidance to maintain software quality at scale.`,
  make_shorter: (text) =>
    `Summary: ${text ? text.slice(0, 100) + '...' : 'Key objective achieved with streamlined execution.'}`,
  custom: (_text, prompt) =>
    `Based on your request "${prompt || 'Ask AI'}":\n\n1. **Analysis**: Identified primary requirements and core concepts.\n2. **Recommendation**: Implement modular component structures and automated state tracking.\n3. **Summary**: Clean, scalable solution ready for immediate deployment.`,
};

export const mockAIService = {
  /**
   * Simulates streaming AI response chunk-by-chunk.
   * Returns a cancellation function.
   */
  streamResponse(
    prompt: string,
    contextText?: string,
    actionType: AIOptionType = 'custom',
    onChunk?: (accumulatedText: string, chunk: string) => void,
    onComplete?: (fullText: string) => void
  ): () => void {
    let cancelled = false;
    let fullResponse = '';

    const generator = MOCK_RESPONSES[actionType] || MOCK_RESPONSES.custom;
    fullResponse = generator(contextText, prompt);

    const words = fullResponse.split(' ');
    let currentText = '';
    let index = 0;

    const interval = setInterval(() => {
      if (cancelled) {
        clearInterval(interval);
        return;
      }

      if (index < words.length) {
        const chunk = (index === 0 ? '' : ' ') + words[index];
        currentText += chunk;
        if (onChunk) {
          onChunk(currentText, chunk);
        }
        index++;
      } else {
        clearInterval(interval);
        if (onComplete && !cancelled) {
          onComplete(currentText);
        }
      }
    }, 40);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  },

  /**
   * One-shot promise response for static requests
   */
  async generateResponse(prompt: string, contextText?: string, actionType: AIOptionType = 'custom'): Promise<string> {
    await delay(600);
    const generator = MOCK_RESPONSES[actionType] || MOCK_RESPONSES.custom;
    return generator(contextText, prompt);
  },
};
