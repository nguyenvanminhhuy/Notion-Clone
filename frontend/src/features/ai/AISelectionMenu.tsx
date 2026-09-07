'use client';

import React from 'react';
import { useAIStore } from '../../stores/aiStore';
import {
  Sparkles,
  Wand2,
  FileText,
  Languages,
  HelpCircle,
  Maximize2,
  Minimize2,
  MessageSquare,
} from 'lucide-react';
import type { AIOptionType } from '../../types/ai';

interface AISelectionMenuProps {
  selectedText: string;
  onClose?: () => void;
  onReplaceText?: (newText: string) => void;
}

interface ActionItem {
  id: AIOptionType;
  label: string;
  icon: React.ElementType;
  prompt?: string;
}

const SELECTION_ACTIONS: ActionItem[] = [
  { id: 'improve', label: 'Improve writing', icon: Wand2 },
  { id: 'summarize', label: 'Summarize', icon: FileText },
  { id: 'translate', label: 'Translate to Spanish', icon: Languages, prompt: 'Translate to Spanish' },
  { id: 'explain', label: 'Explain context', icon: HelpCircle },
  { id: 'make_longer', label: 'Make longer', icon: Maximize2 },
  { id: 'make_shorter', label: 'Make shorter', icon: Minimize2 },
];

export function AISelectionMenu({ selectedText, onClose }: AISelectionMenuProps) {
  const { openPanel, sendMessage } = useAIStore();

  const handleAction = (action: AIOptionType, promptText?: string) => {
    openPanel(selectedText);
    sendMessage(promptText || action, action, selectedText);
    if (onClose) onClose();
  };

  return (
    <div className="ai-selection-popover">
      <div className="ai-selection-header">
        <Sparkles size={14} className="ai-sparkle-icon" />
        <span>Ask AI about selection</span>
      </div>
      <div className="ai-selection-actions">
        {SELECTION_ACTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className="ai-selection-item"
              onClick={() => handleAction(item.id, item.prompt)}
            >
              <Icon size={14} />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button
          className="ai-selection-item custom-ask"
          onClick={() => {
            openPanel(selectedText);
            if (onClose) onClose();
          }}
        >
          <MessageSquare size={14} />
          <span>Custom AI Prompt…</span>
        </button>
      </div>
    </div>
  );
}
