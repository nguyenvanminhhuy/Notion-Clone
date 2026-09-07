import { create } from 'zustand';
import type { AIMessage, AIOptionType } from '../types/ai';
import { mockAIService } from '../mock/mockAIService';

interface AIState {
  isPanelOpen: boolean;
  messages: AIMessage[];
  isGenerating: boolean;
  selectedTextContext: string | null;
  activeCancelFn: (() => void) | null;

  // Actions
  togglePanel: () => void;
  openPanel: (contextText?: string) => void;
  closePanel: () => void;
  setSelectedTextContext: (text: string | null) => void;
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
  selectedTextContext: null,
  activeCancelFn: null,

  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),

  openPanel: (contextText) =>
    set(() => ({
      isPanelOpen: true,
      ...(contextText ? { selectedTextContext: contextText } : {}),
    })),

  closePanel: () => set({ isPanelOpen: false }),

  setSelectedTextContext: (text) => set({ selectedTextContext: text }),

  sendMessage: (prompt, actionType = 'custom', pageContext) => {
    const { isGenerating, stopGeneration, messages, selectedTextContext } = get();

    if (isGenerating) {
      stopGeneration();
    }

    const userMessage: AIMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: prompt,
      createdAt: new Date().toISOString(),
      actionType,
    };

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
    });

    const contextToUse = selectedTextContext || pageContext;

    const cancel = mockAIService.streamResponse(
      prompt,
      contextToUse || undefined,
      actionType,
      (accumulatedText) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantMessageId ? { ...m, content: accumulatedText } : m
          ),
        }));
      },
      (fullText) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantMessageId ? { ...m, content: fullText, isStreaming: false } : m
          ),
          isGenerating: false,
          activeCancelFn: null,
        }));
      }
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
    }),

  regenerateLastResponse: () => {
    const { messages, sendMessage } = get();
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      sendMessage(lastUserMsg.content, (lastUserMsg.actionType as AIOptionType) || 'custom');
    }
  },
}));
