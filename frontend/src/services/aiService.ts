import { httpClient } from './api/httpClient';
import type { AIOptionType } from '../types/ai';
import { ApiError } from './api/apiError';

// ──────────────────────────────────────────
// Backend DTO shapes
// ──────────────────────────────────────────

export interface BackendAIMessageDto {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  actionType?: string | null;
  createdAt: string;
}

export interface BackendAIConversationDto {
  id: string;
  pageId?: string | null;
  title?: string | null;
  messages: BackendAIMessageDto[];
  createdAt: string;
  updatedAt: string;
}

interface AiGenerateResponse {
  response: string;
  actionType: string;
}

// ──────────────────────────────────────────
// Streaming emulation helper
// Animates backend text word-by-word so the UI
// still gets the typewriter effect, but content
// comes from the real backend response.
// ──────────────────────────────────────────
export function simulateStream(
  fullText: string,
  onChunk: (accumulated: string) => void,
  onComplete: (full: string) => void,
  intervalMs = 30
): () => void {
  const words = fullText.split(' ');
  let index = 0;
  let accumulated = '';
  let cancelled = false;

  const timer = setInterval(() => {
    if (cancelled) {
      clearInterval(timer);
      return;
    }
    if (index < words.length) {
      accumulated += (index === 0 ? '' : ' ') + words[index];
      onChunk(accumulated);
      index++;
    } else {
      clearInterval(timer);
      if (!cancelled) {
        onComplete(fullText);
      }
    }
  }, intervalMs);

  return () => {
    cancelled = true;
    clearInterval(timer);
  };
}

// ──────────────────────────────────────────
// AI Service
// ──────────────────────────────────────────
export const aiService = {
  /**
   * One-shot content transformation.
   * POST /api/ai/generate
   *
   * Maps frontend AIOptionType → backend ActionType strings.
   */
  async generate(
    prompt: string,
    contextText?: string | null,
    actionType: AIOptionType = 'custom',
    pageId?: string | null
  ): Promise<string> {
    const body = {
      prompt,
      contextText: contextText || null,
      actionType,
      pageId: pageId || null,
    };

    const data = await httpClient.post<AiGenerateResponse>('/api/ai/generate', body);
    return data.response;
  },

  /**
   * Conversational AI message.
   * POST /api/ai/chat
   */
  async chat(
    message: string,
    options?: {
      conversationId?: string | null;
      pageId?: string | null;
      actionType?: AIOptionType | null;
    }
  ): Promise<BackendAIMessageDto> {
    const body = {
      message,
      conversationId: options?.conversationId || null,
      pageId: options?.pageId || null,
      actionType: options?.actionType || null,
    };

    return httpClient.post<BackendAIMessageDto>('/api/ai/chat', body);
  },

  /**
   * Get AI conversations (optionally filtered by page).
   * GET /api/ai/conversations
   */
  async getConversations(pageId?: string | null): Promise<BackendAIConversationDto[]> {
    return httpClient.get<BackendAIConversationDto[]>('/api/ai/conversations', {
      params: pageId ? { pageId } : undefined,
    });
  },

  /**
   * Create a new AI conversation.
   * POST /api/ai/conversations
   */
  async createConversation(
    pageId?: string | null,
    title?: string | null
  ): Promise<BackendAIConversationDto> {
    return httpClient.post<BackendAIConversationDto>('/api/ai/conversations', {
      pageId: pageId || null,
      title: title || null,
    });
  },

  /**
   * Get a specific AI conversation with full message history.
   * GET /api/ai/conversations/{id}
   */
  async getConversation(conversationId: string): Promise<BackendAIConversationDto> {
    return httpClient.get<BackendAIConversationDto>(`/api/ai/conversations/${conversationId}`);
  },

  /**
   * Delete an AI conversation.
   * DELETE /api/ai/conversations/{id}
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await httpClient.delete(`/api/ai/conversations/${conversationId}`);
  },

  /**
   * Streaming wrapper for the generate endpoint.
   *
   * Calls the real backend, then animates the response word-by-word
   * via simulateStream() so the UI still gets the typewriter effect.
   *
   * Returns a cancel function — calling it stops the animation immediately.
   */
  streamGenerate(
    prompt: string,
    contextText: string | undefined,
    actionType: AIOptionType,
    onChunk: (accumulated: string) => void,
    onComplete: (fullText: string) => void,
    onError: (error: ApiError | Error) => void,
    pageId?: string | null
  ): () => void {
    let cancelStream: (() => void) | null = null;
    let aborted = false;

    // Start async API call immediately
    aiService
      .generate(prompt, contextText, actionType, pageId)
      .then((fullText) => {
        if (aborted) return;
        // Animate the real response
        cancelStream = simulateStream(fullText, onChunk, onComplete);
      })
      .catch((err: unknown) => {
        if (aborted) return;
        onError(err instanceof Error ? err : new Error(String(err)));
      });

    // Return cancellation function
    return () => {
      aborted = true;
      cancelStream?.();
    };
  },
};
