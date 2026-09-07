export type AIRole = 'user' | 'assistant' | 'system';

export interface AIMessage {
  id: string;
  role: AIRole;
  content: string;
  createdAt: string;
  isStreaming?: boolean;
  actionType?: string;
}

export interface AIConversation {
  id: string;
  pageId?: string;
  title?: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

export type AIOptionType =
  | 'summarize'
  | 'improve'
  | 'rewrite'
  | 'translate'
  | 'explain'
  | 'continue'
  | 'make_longer'
  | 'make_shorter'
  | 'custom';

export interface AIOption {
  id: AIOptionType;
  label: string;
  iconName?: string;
  promptPrefix?: string;
}
