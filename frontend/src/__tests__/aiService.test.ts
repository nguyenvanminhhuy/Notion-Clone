import { describe, it, expect } from 'vitest';
import { mockAIService } from '../mock/mockAIService';

describe('Mock AI Service', () => {
  it('generates simulated responses for built-in prompt options', async () => {
    const summary = await mockAIService.generateResponse(
      'Summarize this document',
      'The project aims to build an AI-powered Notion clone using React and Next.js.',
      'summarize'
    );

    expect(summary).toBeDefined();
    expect(summary.length).toBeGreaterThan(10);
  });

  it('streams response chunks via onChunk callback', async () => {
    const chunks: string[] = [];
    const fullText = await new Promise<string>((resolve) => {
      mockAIService.streamResponse(
        'Explain this paragraph',
        'This is a sample paragraph explaining workflow.',
        'explain',
        (_acc, chunk) => {
          chunks.push(chunk);
        },
        (completedText) => {
          resolve(completedText);
        }
      );
    });

    expect(chunks.length).toBeGreaterThan(0);
    expect(fullText.length).toBeGreaterThan(0);
  });

  it('handles custom user prompts', async () => {
    const response = await mockAIService.generateResponse(
      'Write a poem about coding',
      '',
      'custom'
    );

    expect(response).toBeDefined();
    expect(response).toContain('Analysis');
  });
});
