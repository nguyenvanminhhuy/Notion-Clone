'use client';

import React from 'react';
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
} from 'lucide-react';

interface BubbleMenuBarProps {
  editor: Editor;
}

type ActiveFormat = {
  name: 'bold' | 'italic' | 'underline' | 'strike' | 'code' | 'highlight';
};

export function BubbleMenuBar({ editor }: BubbleMenuBarProps) {
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
      <div className="bubble-menu">
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
      </div>
    </BubbleMenu>
  );
}
