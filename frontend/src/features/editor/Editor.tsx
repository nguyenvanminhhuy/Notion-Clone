'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { buildEditorExtensions } from './editorExtensions';
import { BubbleMenuBar } from './BubbleMenuBar';
import { FloatingToolbar } from './FloatingToolbar';

interface EditorProps {
  initialContent: string;
  onSave: (content: string) => Promise<void>;
  onSaveError?: (error: unknown) => void;
  onSavingStateChange?: (isSaving: boolean) => void;
  placeholder?: string;
  editable?: boolean;
  pageId?: string | null;
}

const AUTOSAVE_DELAY_MS = 1000;

export function Editor({
  initialContent,
  onSave,
  onSavingStateChange,
  onSaveError,
  editable = true,
  pageId,
}: EditorProps) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingContentRef = useRef<string | null>(null);
  const onSaveRef = useRef(onSave);
  const onSaveErrorRef = useRef(onSaveError);

  useEffect(() => {
    onSaveRef.current = onSave;
    onSaveErrorRef.current = onSaveError;
  }, [onSave, onSaveError]);

  const performSave = useCallback(async (contentJson: string) => {
    onSavingStateChange?.(true);
    try {
      await onSave(contentJson);
    } catch (error) {
      onSaveError?.(error);
    } finally {
      onSavingStateChange?.(false);
    }
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

  const triggerSave = useCallback(
    (contentJson: string) => {
      // Clear any pending save
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      pendingContentRef.current = contentJson;
      onSavingStateChange?.(true);

      saveTimerRef.current = setTimeout(async () => {
        saveTimerRef.current = null;
        pendingContentRef.current = null;
        await performSave(contentJson);
      }, AUTOSAVE_DELAY_MS);
    },
    [onSavingStateChange, performSave]
  );

  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const pendingContent = pendingContentRef.current;
    pendingContentRef.current = null;
    if (pendingContent) {
      void onSaveRef.current(pendingContent).catch((error) => onSaveErrorRef.current?.(error));
    }
  }, []);

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
