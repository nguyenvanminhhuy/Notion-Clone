'use client';

import React, { useState, useRef, useEffect } from 'react';
import { type Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Highlighter,
  Link as LinkIcon,
  Pilcrow,
  Heading1,
  Heading2,
  Heading3,
  Sparkles,
} from 'lucide-react';
import { AISelectionMenu } from '../ai/AISelectionMenu';

interface BubbleMenuBarProps {
  editor: Editor;
}

type ActiveFormat = {
  name: 'bold' | 'italic' | 'underline' | 'strike' | 'code' | 'highlight';
};

export function BubbleMenuBar({ editor }: BubbleMenuBarProps) {
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const aiButtonRef = useRef<HTMLButtonElement>(null);
  const aiMenuRef = useRef<HTMLDivElement>(null);

  // Close AI menu on outside click
  useEffect(() => {
    if (!showAIMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (
        !aiButtonRef.current?.contains(e.target as Node) &&
        !aiMenuRef.current?.contains(e.target as Node)
      ) {
        setShowAIMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showAIMenu]);

  const formatButtons: Array<{
    label: string;
    icon: React.ReactNode;
    action: () => void;
    isActive: () => boolean;
  }> = [
    {
      label: 'Bold',
      icon: <Bold size={14} />,
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive('bold'),
    },
    {
      label: 'Italic',
      icon: <Italic size={14} />,
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive('italic'),
    },
    {
      label: 'Underline',
      icon: <UnderlineIcon size={14} />,
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: () => editor.isActive('underline'),
    },
    {
      label: 'Strike',
      icon: <Strikethrough size={14} />,
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: () => editor.isActive('strike'),
    },
    {
      label: 'Highlight',
      icon: <Highlighter size={14} />,
      action: () => editor.chain().focus().toggleHighlight().run(),
      isActive: () => editor.isActive('highlight'),
    },
    {
      label: 'Inline Code',
      icon: <Code size={14} />,
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: () => editor.isActive('code'),
    },
  ];

  const headingButtons: Array<{
    label: string;
    icon: React.ReactNode;
    action: () => void;
    isActive: () => boolean;
  }> = [
    {
      label: 'Paragraph',
      icon: <Pilcrow size={14} />,
      action: () => editor.chain().focus().setParagraph().run(),
      isActive: () =>
        !editor.isActive('heading') &&
        !editor.isActive('bulletList') &&
        !editor.isActive('orderedList'),
    },
    {
      label: 'Heading 1',
      icon: <Heading1 size={14} />,
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: () => editor.isActive('heading', { level: 1 }),
    },
    {
      label: 'Heading 2',
      icon: <Heading2 size={14} />,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editor.isActive('heading', { level: 2 }),
    },
    {
      label: 'Heading 3',
      icon: <Heading3 size={14} />,
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: () => editor.isActive('heading', { level: 3 }),
    },
  ];

  const handleSetLink = () => {
    const url = window.prompt('Enter URL:', editor.getAttributes('link').href ?? '');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: 'top' }}
      shouldShow={({ editor: ed, from, to }) => {
        // Only show for non-empty selections
        return from !== to && !ed.isActive('image') && !ed.isActive('codeBlock');
      }}
    >
      <div className="bubble-menu" style={{ position: 'relative' }}>
        {/* Heading type group */}
        {headingButtons.map((btn) => (
          <button
            key={btn.label}
            className={`bubble-menu-btn ${btn.isActive() ? 'active' : ''}`}
            onClick={btn.action}
            title={btn.label}
            aria-label={btn.label}
          >
            {btn.icon}
          </button>
        ))}

        <div className="bubble-menu-divider" />

        {/* Format group */}
        {formatButtons.map((btn) => (
          <button
            key={btn.label}
            className={`bubble-menu-btn ${btn.isActive() ? 'active' : ''}`}
            onClick={btn.action}
            title={btn.label}
            aria-label={btn.label}
          >
            {btn.icon}
          </button>
        ))}

        <div className="bubble-menu-divider" />

        {/* Link */}
        <button
          className={`bubble-menu-btn ${editor.isActive('link') ? 'active' : ''}`}
          onClick={handleSetLink}
          title="Link"
          aria-label="Set link"
        >
          <LinkIcon size={14} />
        </button>

        <div className="bubble-menu-divider" />

        {/* AI Actions */}
        <button
          ref={aiButtonRef}
          className={`bubble-menu-btn ai-bubble-btn ${showAIMenu ? 'active' : ''}`}
          title="Ask AI"
          aria-label="AI actions for selected text"
          onClick={() => {
            const { from, to } = editor.state.selection;
            const text = editor.state.doc.textBetween(from, to, ' ');
            setSelectedText(text);
            setShowAIMenu((v) => !v);
          }}
        >
          <Sparkles size={14} />
        </button>

        {/* AI Selection popover — rendered below bubble menu */}
        {showAIMenu && (
          <div
            ref={aiMenuRef}
            style={{
              position: 'absolute',
              top: '110%',
              right: 0,
              zIndex: 300,
            }}
          >
            <AISelectionMenu
              selectedText={selectedText}
              onClose={() => setShowAIMenu(false)}
            />
          </div>
        )}
      </div>
    </BubbleMenu>
  );
}
