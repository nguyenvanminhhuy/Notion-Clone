'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { type Editor } from '@tiptap/react';
import {
  Pilcrow,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code2,
  Minus,
  Table as TableIcon,
  Image as ImageIcon,
  Plus,
} from 'lucide-react';

interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  keywords: string[];
  action: (editor: Editor) => void;
}

const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: 'paragraph',
    label: 'Text',
    description: 'Plain paragraph',
    icon: <Pilcrow size={16} />,
    keywords: ['text', 'paragraph', 'p'],
    action: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    id: 'heading1',
    label: 'Heading 1',
    description: 'Large section heading',
    icon: <Heading1 size={16} />,
    keywords: ['heading', 'h1', 'title', '1'],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: 'heading2',
    label: 'Heading 2',
    description: 'Medium section heading',
    icon: <Heading2 size={16} />,
    keywords: ['heading', 'h2', '2'],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: 'heading3',
    label: 'Heading 3',
    description: 'Small section heading',
    icon: <Heading3 size={16} />,
    keywords: ['heading', 'h3', '3'],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: 'bulletList',
    label: 'Bullet List',
    description: 'Unordered list',
    icon: <List size={16} />,
    keywords: ['bullet', 'list', 'ul', 'unordered'],
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: 'orderedList',
    label: 'Numbered List',
    description: 'Ordered list with numbers',
    icon: <ListOrdered size={16} />,
    keywords: ['numbered', 'ordered', 'list', 'ol', '1.'],
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: 'taskList',
    label: 'Checklist',
    description: 'Task list with checkboxes',
    icon: <CheckSquare size={16} />,
    keywords: ['checklist', 'task', 'todo', 'checkbox'],
    action: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    id: 'blockquote',
    label: 'Quote',
    description: 'Blockquote callout',
    icon: <Quote size={16} />,
    keywords: ['quote', 'blockquote', 'callout'],
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    id: 'codeBlock',
    label: 'Code Block',
    description: 'Syntax highlighted code',
    icon: <Code2 size={16} />,
    keywords: ['code', 'block', 'pre', 'codeblock'],
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: 'divider',
    label: 'Divider',
    description: 'Horizontal rule',
    icon: <Minus size={16} />,
    keywords: ['divider', 'hr', 'rule', 'line', 'separator'],
    action: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    id: 'table',
    label: 'Table',
    description: '3×3 table',
    icon: <TableIcon size={16} />,
    keywords: ['table', 'grid', 'spreadsheet'],
    action: (editor) =>
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    id: 'image',
    label: 'Image',
    description: 'Insert an image from URL',
    icon: <ImageIcon size={16} />,
    keywords: ['image', 'img', 'photo', 'picture'],
    action: (editor) => {
      useUIStore.getState().openUploadDialog((url: string) => {
        editor.chain().focus().setImage({ src: url }).run();
      });
    },
  },
];

interface SlashMenuState {
  isOpen: boolean;
  query: string;
  position: { top: number; left: number };
  selectedIndex: number;
  startPos: number;
}

interface FloatingToolbarProps {
  editor: Editor;
}

export function FloatingToolbar({ editor }: FloatingToolbarProps) {
  const [menu, setMenu] = useState<SlashMenuState>({
    isOpen: false,
    query: '',
    position: { top: 0, left: 0 },
    selectedIndex: 0,
    startPos: 0,
  });
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredCommands = SLASH_COMMANDS.filter((cmd) => {
    if (!menu.query) return true;
    const q = menu.query.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.keywords.some((k) => k.includes(q))
    );
  });

  // Listen for '/' keypress in editor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!menu.isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMenu((prev) => ({
          ...prev,
          selectedIndex: Math.min(prev.selectedIndex + 1, filteredCommands.length - 1),
        }));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMenu((prev) => ({
          ...prev,
          selectedIndex: Math.max(prev.selectedIndex - 1, 0),
        }));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        executeCommand(filteredCommands[menu.selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [menu.isOpen, menu.selectedIndex, filteredCommands]);

  // Subscribe to editor updates
  useEffect(() => {
    const handleUpdate = () => {
      const { state } = editor;
      const { selection } = state;
      const { $from } = selection;

      const lineText = $from.nodeBefore?.textContent ?? '';
      const slashIndex = lineText.lastIndexOf('/');

      if (slashIndex !== -1) {
        const query = lineText.slice(slashIndex + 1);
        // Only open if slash was typed (not pasted)
        if (!menu.isOpen && lineText.endsWith('/') && query === '') {
          // Get cursor position in DOM
          const domSel = window.getSelection();
          if (!domSel || domSel.rangeCount === 0) return;
          const range = domSel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const editorEl = editor.view.dom.closest('.editor-scroll-area') as HTMLElement | null;
          const offsetTop = editorEl?.getBoundingClientRect().top ?? 0;
          const offsetLeft = editorEl?.getBoundingClientRect().left ?? 0;

          setMenu({
            isOpen: true,
            query: '',
            position: {
              top: rect.bottom - offsetTop + (editorEl?.scrollTop ?? 0) + 4,
              left: rect.left - offsetLeft,
            },
            selectedIndex: 0,
            startPos: $from.pos,
          });
        } else if (menu.isOpen) {
          setMenu((prev) => ({ ...prev, query, selectedIndex: 0 }));
        }
      } else if (menu.isOpen) {
        closeMenu(false);
      }
    };

    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, menu.isOpen]);

  // Close if click outside
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu(false);
      }
    };
    if (menu.isOpen) {
      document.addEventListener('mousedown', handleMouseDown);
      return () => document.removeEventListener('mousedown', handleMouseDown);
    }
  }, [menu.isOpen]);

  const closeMenu = useCallback(
    (deleteSlash = true) => {
      if (deleteSlash && menu.isOpen) {
        // Delete the slash character
        const { startPos } = menu;
        const slashStartPos = startPos - (menu.query.length + 1);
        editor
          .chain()
          .focus()
          .deleteRange({ from: slashStartPos, to: startPos })
          .run();
      }
      setMenu((prev) => ({ ...prev, isOpen: false, query: '' }));
    },
    [editor, menu]
  );

  const executeCommand = useCallback(
    (command: SlashCommand | undefined) => {
      if (!command) return;
      // Delete slash + query text before inserting block
      const { startPos, query } = menu;
      const deleteFrom = startPos - query.length - 1; // -1 for the slash
      editor.chain().focus().deleteRange({ from: deleteFrom, to: startPos }).run();
      command.action(editor);
      setMenu((prev) => ({ ...prev, isOpen: false, query: '' }));
    },
    [editor, menu]
  );

  if (!menu.isOpen || filteredCommands.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="slash-menu"
      style={{
        position: 'absolute',
        top: `${menu.position.top}px`,
        left: `${menu.position.left}px`,
        zIndex: 200,
      }}
      role="menu"
      aria-label="Slash commands"
    >
      {filteredCommands.map((cmd, idx) => (
        <button
          key={cmd.id}
          className={`slash-menu-item ${idx === menu.selectedIndex ? 'selected' : ''}`}
          onMouseEnter={() => setMenu((prev) => ({ ...prev, selectedIndex: idx }))}
          onClick={() => executeCommand(cmd)}
          role="menuitem"
        >
          <span className="slash-menu-icon">{cmd.icon}</span>
          <span className="slash-menu-text">
            <span className="slash-menu-label">{cmd.label}</span>
            <span className="slash-menu-desc">{cmd.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
