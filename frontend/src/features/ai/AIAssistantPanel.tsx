'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAIStore } from '../../stores/aiStore';
import {
  Sparkles,
  X,
  Send,
  Square,
  RotateCcw,
  Copy,
  Check,
  Trash2,
  FileText,
  Wand2,
  Languages,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import type { AIOptionType } from '../../types/ai';

interface AIAssistantPanelProps {
  pageTitle?: string;
  pageContentText?: string;
}

const QUICK_PROMPTS: { label: string; action: AIOptionType; icon: React.ElementType }[] = [
  { label: 'Summarize page', action: 'summarize', icon: FileText },
  { label: 'Improve writing', action: 'improve', icon: Wand2 },
  { label: 'Continue writing', action: 'continue', icon: ChevronRight },
  { label: 'Translate (Spanish)', action: 'translate', icon: Languages },
  { label: 'Explain context', action: 'explain', icon: HelpCircle },
];

export function AIAssistantPanel({ pageTitle, pageContentText }: AIAssistantPanelProps) {
  const {
    isPanelOpen,
    closePanel,
    messages,
    isGenerating,
    sendMessage,
    stopGeneration,
    clearMessages,
    regenerateLastResponse,
    selectedTextContext,
    setSelectedTextContext,
  } = useAIStore();

  const [inputPrompt, setInputPrompt] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isPanelOpen) {
      scrollToBottom();
    }
  }, [messages, isPanelOpen]);

  if (!isPanelOpen) return null;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || isGenerating) return;

    sendMessage(inputPrompt, 'custom', pageContentText);
    setInputPrompt('');
  };

  const handleQuickPrompt = (action: AIOptionType, label: string) => {
    if (isGenerating) return;
    sendMessage(label, action, pageContentText);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <aside className="ai-assistant-panel" aria-label="AI Assistant Panel">
      {/* Header */}
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <div className="ai-badge-icon">
            <Sparkles size={16} />
          </div>
          <span className="ai-title-text">Notion AI Assistant</span>
        </div>
        <div className="ai-panel-actions">
          <button
            className="topbar-icon-btn"
            onClick={clearMessages}
            title="Clear Chat History"
            aria-label="Clear Chat History"
          >
            <Trash2 size={15} />
          </button>
          <button
            className="topbar-icon-btn"
            onClick={closePanel}
            title="Close AI Assistant"
            aria-label="Close AI Assistant"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Selected context banner */}
      {selectedTextContext && (
        <div className="ai-context-banner">
          <div className="ai-context-info">
            <span className="ai-context-label">Selected Context:</span>
            <span className="ai-context-snippet">"{selectedTextContext.slice(0, 70)}..."</span>
          </div>
          <button
            className="ai-context-clear"
            onClick={() => setSelectedTextContext(null)}
            title="Clear selected context"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Quick Prompts Bar */}
      <div className="ai-quick-prompts">
        {QUICK_PROMPTS.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.action}
              className="ai-chip-btn"
              onClick={() => handleQuickPrompt(p.action, p.label)}
              disabled={isGenerating}
            >
              <Icon size={12} />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Message List */}
      <div className="ai-messages-list">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isCopied = copiedId === msg.id;

          return (
            <div
              key={msg.id}
              className={`ai-message-wrapper ${isUser ? 'user-msg' : 'assistant-msg'}`}
            >
              {!isUser && (
                <div className="ai-avatar">
                  <Sparkles size={14} />
                </div>
              )}
              <div className="ai-message-content">
                <div className="ai-message-text">
                  {msg.content}
                  {msg.isStreaming && <span className="ai-cursor-blink">▋</span>}
                </div>
                {!isUser && !msg.isStreaming && msg.content && (
                  <div className="ai-message-footer">
                    <button
                      className="ai-msg-action-btn"
                      onClick={() => handleCopy(msg.id, msg.content)}
                      title="Copy response"
                    >
                      {isCopied ? <Check size={13} /> : <Copy size={13} />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Regenerate Bar if last was assistant */}
      {!isGenerating && messages.length > 1 && (
        <div className="ai-regenerate-bar">
          <button className="ai-regenerate-btn" onClick={regenerateLastResponse}>
            <RotateCcw size={13} />
            <span>Regenerate response</span>
          </button>
        </div>
      )}

      {/* Input Form */}
      <form className="ai-input-form" onSubmit={handleSend}>
        <div className="ai-input-wrapper">
          <input
            type="text"
            className="ai-input-field"
            placeholder={
              selectedTextContext ? 'Ask AI about selected text…' : 'Ask AI to write, edit, or summarize…'
            }
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isGenerating}
          />
          {isGenerating ? (
            <button
              type="button"
              className="ai-send-btn stop-btn"
              onClick={stopGeneration}
              title="Stop generating"
              aria-label="Stop generating"
            >
              <Square size={14} />
            </button>
          ) : (
            <button
              type="submit"
              className="ai-send-btn"
              disabled={!inputPrompt.trim()}
              title="Send message"
              aria-label="Send message"
            >
              <Send size={14} />
            </button>
          )}
        </div>
      </form>
    </aside>
  );
}
