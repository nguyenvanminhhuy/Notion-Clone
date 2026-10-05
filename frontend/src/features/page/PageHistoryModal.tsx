'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, RotateCcw, Clock, Loader2, Check } from 'lucide-react';
import { pageService } from '../../services/pageService';
import { useToastStore } from '../../stores/toastStore';
import type { Page, PageVersion } from '../../types/page';

interface PageHistoryModalProps {
  page: Page;
  isOpen: boolean;
  onClose: () => void;
  onRestored?: (page: Page) => void;
  onBeforeRestore?: () => Promise<void>;
}

export function PageHistoryModal({ page, isOpen, onClose, onRestored, onBeforeRestore }: PageHistoryModalProps) {
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [versionDetail, setVersionDetail] = useState<PageVersion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const { addToast } = useToastStore();
  const loadKey = `${isOpen}:${page.id}`;
  const [previousLoadKey, setPreviousLoadKey] = useState(loadKey);
  if (previousLoadKey !== loadKey) {
    setPreviousLoadKey(loadKey);
    setIsLoading(isOpen);
  }

  useEffect(() => {
    if (isOpen && page.id) {
      pageService
        .getPageVersions(page.id)
        .then((list) => {
          setVersions(list);
          if (list.length > 0) {
            setSelectedVersionId(list[0].id);
          }
        })
        .catch((err) => {
          console.error(err);
          addToast({ message: 'Failed to load version history', type: 'error' });
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, page.id, addToast]);

  useEffect(() => {
    if (selectedVersionId && page.id) {
      pageService
        .getPageVersionDetail(page.id, selectedVersionId)
        .then((detail) => setVersionDetail(detail))
        .catch(console.error);
    }
  }, [selectedVersionId, page.id]);

  const handleRestore = async () => {
    if (!selectedVersionId || !page.id) return;
    setIsRestoring(true);
    try {
      await onBeforeRestore?.();
      const restored = await pageService.restorePageVersion(page.id, selectedVersionId);
      addToast({ message: 'Version restored successfully', type: 'success' });
      onRestored?.(restored);
      onClose();
    } catch (err) {
      console.error(err);
      addToast({ message: 'Failed to restore version', type: 'error' });
    } finally {
      setIsRestoring(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-2xl h-[480px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold">
              <History size={18} className="text-indigo-600" />
              <span>Version History — {page.title || 'Untitled'}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-md transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* Version List Sidebar */}
            <div className="w-1/3 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto p-2 space-y-1">
              {isLoading ? (
                <div className="p-4 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Loading versions...</span>
                </div>
              ) : versions.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-400">
                  <Clock size={20} className="mx-auto mb-1 opacity-50" />
                  No prior versions recorded yet
                </div>
              ) : (
                versions.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVersionId(v.id)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex flex-col gap-0.5 cursor-pointer ${
                      selectedVersionId === v.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <span className="font-semibold truncate">
                      {new Date(v.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-[10px] text-zinc-400">By {v.editedBy}</span>
                  </button>
                ))
              )}
            </div>

            {/* Preview Area */}
            <div className="flex-1 flex flex-col p-4 overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/30">
              {versionDetail ? (
                <>
                  <div className="flex-1 overflow-y-auto p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono whitespace-pre-wrap break-all text-zinc-800 dark:text-zinc-200">
                    {versionDetail.content || '{"type":"doc","content":[]}'}
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={handleRestore}
                      disabled={isRestoring}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                    >
                      {isRestoring ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <RotateCcw size={14} />
                      )}
                      <span>Restore this version</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-zinc-400">
                  Select a version to preview content
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
