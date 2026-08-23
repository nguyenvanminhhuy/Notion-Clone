'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { buildEditorExtensions } from './editorExtensions';
import { BubbleMenuBar } from './BubbleMenuBar';
import { FloatingToolbar } from './FloatingToolbar';

interface EditorProps {
  initialContent: string;
  onSave: (content: string) => void;
  onSavingStateChange?: (isSaving: boolean) => void;
  placeholder?: string;
  editable?: boolean;
}

const AUTOSAVE_DELAY_MS = 1000;

export function Editor({
  initialContent,
  onSave,
  onSavingStateChange,
  editable = true,
}: EditorProps) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Parse initial content safely
  const getInitialContent = () => {
    if (!initialContent) return '';
    try {
      const parsed = JSON.parse(initialContent);
      return parsed;
    } catch {
      return initialContent;
    }
  };

  const triggerSave = useCallback(
    (contentJson: string) => {
      // Clear any pending save
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      setIsSaving(true);
      onSavingStateChange?.(true);

      saveTimerRef.current = setTimeout(() => {
        onSave(contentJson);
        setIsSaving(false);
        onSavingStateChange?.(false);
      }, AUTOSAVE_DELAY_MS);
    },
    [onSave, onSavingStateChange]
  );

  const editor = useEditor({
    extensions: buildEditorExtensions(),
    content: getInitialContent(),
    editable,
    editorProps: {
      attributes: {
        class: 'prose-editor',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor: ed }) => {
      const json = JSON.stringify(ed.getJSON());
      triggerSave(json);
    },
    immediatelyRender: false,
  });

  if (!editor) {
    return (
      <div className="editor-loading">
        <span>Loading editor…</span>
      </div>
    );
  }

  return (
    <div className="editor-wrapper" style={{ position: 'relative' }}>
      {/* Bubble menu for text selection */}
      <BubbleMenuBar editor={editor} />

      {/* Editor content area — also anchors slash menu */}
      <div className="editor-scroll-area" style={{ position: 'relative' }}>
        {/* Slash command floating menu */}
        <FloatingToolbar editor={editor} />

        <EditorContent
          editor={editor}
          className="editor-content"
        />
      </div>
    </div>
  );
}
