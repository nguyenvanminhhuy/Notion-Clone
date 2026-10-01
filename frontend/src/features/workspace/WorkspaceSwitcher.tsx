'use client';

import { useState } from 'react';
import { ChevronDown, Plus, Check, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspaceStore } from '../../stores/workspaceStore';

export function WorkspaceSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const { workspaces, currentWorkspaceId, setCurrentWorkspace, createWorkspace } = useWorkspaceStore();
  const currentWorkspace = workspaces.find((ws) => ws.id === currentWorkspaceId);

  const handleSelect = (id: string) => {
    setCurrentWorkspace(id);
    setIsOpen(false);
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    try {
      await createWorkspace({ name: newWsName.trim(), iconEmoji: '💼' });
      setNewWsName('');
      setIsCreating(false);
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="workspace-switcher-btn"
        aria-label="Switch workspace"
        aria-expanded={isOpen}
      >
        <span className="workspace-icon">
          {currentWorkspace?.iconEmoji ?? '🏠'}
        </span>
        <span className="workspace-name">{currentWorkspace?.name ?? 'Workspace'}</span>
        <ChevronDown
          size={14}
          className={`workspace-chevron ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => {
                setIsOpen(false);
                setIsCreating(false);
              }}
            />
            <motion.div
              className="workspace-dropdown"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <div className="workspace-dropdown-header">Workspaces</div>
              <div className="workspace-list">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    className={`workspace-item ${ws.id === currentWorkspaceId ? 'active' : ''}`}
                    onClick={() => handleSelect(ws.id)}
                  >
                    <span className="workspace-item-icon">{ws.iconEmoji ?? '🏠'}</span>
                    <span className="workspace-item-name">{ws.name}</span>
                    {ws.id === currentWorkspaceId && (
                      <Check size={14} className="workspace-item-check" />
                    )}
                  </button>
                ))}
              </div>
              <div className="workspace-dropdown-footer">
                {isCreating ? (
                  <form onSubmit={handleCreateWorkspace} className="flex items-center gap-1 p-1 w-full">
                    <input
                      type="text"
                      value={newWsName}
                      onChange={(e) => setNewWsName(e.target.value)}
                      placeholder="Workspace name..."
                      autoFocus
                      className="w-full text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      className="px-2 py-1 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
                    >
                      Add
                    </button>
                  </form>
                ) : (
                  <>
                    <button
                      className="workspace-action-btn"
                      onClick={() => setIsCreating(true)}
                    >
                      <Plus size={14} />
                      <span>New Workspace</span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
