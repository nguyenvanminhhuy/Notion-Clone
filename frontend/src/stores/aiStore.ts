import { create } from 'zustand';
import type { AIMessage, AIOptionType } from '../types/ai';
import { aiService } from '../services/aiService';
import { ApiError } from '../services/api/apiError';
import { useToastStore } from './toastStore';

interface AIState {
  isPanelOpen: boolean;
  messages: AIMessage[];
  isGenerating: boolean;
  error: string | null;
  selectedTextContext: string | null;
  activeCancelFn: (() => void) | null;
  /** Optional page context passed from the editor */
  currentPageId: string | null;

  // Actions
  togglePanel: () => void;
  openPanel: (contextText?: string) => void;
  closePanel: () => void;
  setSelectedTextContext: (text: string | null) => void;
  setCurrentPageId: (pageId: string | null) => void;
  sendMessage: (prompt: string, actionType?: AIOptionType, pageContext?: string) => void;
  stopGeneration: () => void;
  clearMessages: () => void;
  regenerateLastResponse: () => void;
}

const INITIAL_MESSAGES: AIMessage[] = [
  {
    id: 'msg-welcome',
    role: 'assistant',
    content: "👋 Hi! I'm your AI Assistant. How can I help you write, summarize, or edit your notes today?",
    createdAt: new Date().toISOString(),
  },
];

export const useAIStore = create<AIState>((set, get) => ({
  isPanelOpen: false,
  messages: INITIAL_MESSAGES,
  isGenerating: false,
  error: null,
  selectedTextContext: null,
  activeCancelFn: null,
  currentPageId: null,

  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),

  openPanel: (contextText) =>
    set(() => ({
      isPanelOpen: true,
      ...(contextText ? { selectedTextContext: contextText } : {}),
    })),

  closePanel: () => set({ isPanelOpen: false }),

  setSelectedTextContext: (text) => set({ selectedTextContext: text }),

  setCurrentPageId: (pageId) => set({ currentPageId: pageId }),

  sendMessage: (prompt, actionType = 'custom', pageContext) => {
    const { isGenerating, stopGeneration, messages, selectedTextContext, currentPageId } = get();

    if (isGenerating) {
      stopGeneration();
    }

    // Build user message
    const userMessage: AIMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: prompt,
      createdAt: new Date().toISOString(),
      actionType,
    };

    // Placeholder assistant message (streaming)
    const assistantMessageId = `msg-${Date.now()}-ai`;
    const initialAssistantMsg: AIMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      isStreaming: true,
      actionType,
    };

    set({
      messages: [...messages, userMessage, initialAssistantMsg],
      isGenerating: true,
      error: null,
    });

    const contextToUse = selectedTextContext || pageContext || undefined;

    // Call real backend via streamGenerate (API call → animate response)
    const cancel = aiService.streamGenerate(
      prompt,
      contextToUse,
      actionType,
      // onChunk: update the streaming message with accumulated text
      (accumulatedText) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantMessageId ? { ...m, content: accumulatedText } : m
          ),
        }));
      },
      // onComplete: finalize the message
      (fullText) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantMessageId ? { ...m, content: fullText, isStreaming: false } : m
          ),
          isGenerating: false,
          activeCancelFn: null,
        }));
      },
      // onError: surface error in the assistant message bubble
      (err) => {
        let errorMessage = 'AI request failed. Please try again.';

        if (err instanceof ApiError) {
          if (err.statusCode === 429) {
            errorMessage = 'Rate limit reached. Please wait a moment before trying again.';
          } else if (err.statusCode === 408) {
            errorMessage = 'Request timed out. The AI service may be busy — try again.';
          } else if (err.isNetworkError) {
            errorMessage = 'Network error. Check your connection and try again.';
          } else {
            errorMessage = err.message || errorMessage;
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        console.error('[aiStore] sendMessage error:', err);

        useToastStore.getState().addToast({ message: errorMessage, type: 'error' });

        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: `⚠️ ${errorMessage}`, isStreaming: false }
              : m
          ),
          isGenerating: false,
          activeCancelFn: null,
          error: errorMessage,
        }));
      },
      // Pass current page context for backend AI personalisation
      currentPageId
    );

    set({ activeCancelFn: cancel });
  },

  stopGeneration: () => {
    const { activeCancelFn, messages } = get();
    if (activeCancelFn) {
      activeCancelFn();
    }
    set({
      isGenerating: false,
      activeCancelFn: null,
      messages: messages.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m)),
    });
  },

  clearMessages: () =>
    set({
      messages: INITIAL_MESSAGES,
      isGenerating: false,
      activeCancelFn: null,
      error: null,
    }),

  regenerateLastResponse: () => {
    const { messages, sendMessage } = get();
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      sendMessage(lastUserMsg.content, (lastUserMsg.actionType as AIOptionType) || 'custom');
    }
  },
}));
