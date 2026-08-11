'use client';

import { useState } from 'react';
import { ChevronDown, Plus, Check, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspaceStore } from '../../stores/workspaceStore';

export function WorkspaceSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { workspaces, currentWorkspaceId, setCurrentWorkspace } = useWorkspaceStore();
  const currentWorkspace = workspaces.find((ws) => ws.id === currentWorkspaceId);

  const handleSelect = (id: string) => {
    setCurrentWorkspace(id);
    setIsOpen(false);
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
              onClick={() => setIsOpen(false)}
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
                <button className="workspace-action-btn">
                  <Plus size={14} />
                  <span>New Workspace</span>
                </button>
                <button className="workspace-action-btn">
                  <Settings size={14} />
                  <span>Settings</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
