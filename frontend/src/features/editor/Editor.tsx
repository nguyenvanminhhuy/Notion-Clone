'use client';

import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { buildEditorExtensions } from './editorExtensions';
import { BubbleMenuBar } from './BubbleMenuBar';
import { FloatingToolbar } from './FloatingToolbar';
import { Autosave } from './autosave';

interface EditorProps {
  initialContent: string;
  onSave: (content: string) => Promise<void>;
  onSaveError?: (error: unknown) => void;
  onSavingStateChange?: (isSaving: boolean) => void;
  placeholder?: string;
  editable?: boolean;
  pageId?: string | null;
  onAutosaveReady?: (autosave: Autosave) => void;
}

export function Editor({
  initialContent,
  onSave,
  onSavingStateChange,
  onSaveError,
  editable = true,
  pageId,
  onAutosaveReady,
}: EditorProps) {
  const autosaveRef = useRef<Autosave | null>(null);
  const onSaveRef = useRef(onSave);
  const onSaveErrorRef = useRef(onSaveError);
  const onSavingRef = useRef(onSavingStateChange);

  useEffect(() => {
    onSaveRef.current = onSave;
    onSaveErrorRef.current = onSaveError;
    onSavingRef.current = onSavingStateChange;
  }, [onSave, onSaveError, onSavingStateChange]);

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

  useEffect(() => {
    const autosave = new Autosave(
      (content) => onSaveRef.current(content),
      (saving) => onSavingRef.current?.(saving),
      (error) => onSaveErrorRef.current?.(error),
    );
    autosaveRef.current = autosave;
    onAutosaveReady?.(autosave);
    return () => { void autosave.dispose(); };
  }, [onAutosaveReady]);

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
      if (editable) autosaveRef.current?.schedule(json);
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
      {editable && <BubbleMenuBar editor={editor} />}

      {/* Editor content area — also anchors slash menu */}
      <div className="editor-scroll-area" style={{ position: 'relative' }}>
        {/* Slash command floating menu */}
        {editable && <FloatingToolbar editor={editor} pageId={pageId ?? null} />}

        <EditorContent
          editor={editor}
          className="editor-content"
        />
      </div>
    </div>
  );
}
