'use client';

import React from 'react';
import { FilePlus, Sparkles } from 'lucide-react';
import { usePageStore } from '../../stores/pageStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';

export const EmptyWorkspace: React.FC = () => {
  const { createPage } = usePageStore();
  const { currentWorkspaceId } = useWorkspaceStore();

  return (
    <div className="empty-workspace-container">
      <div className="empty-workspace-card">
        <div className="empty-workspace-icon-wrapper">
          <Sparkles className="w-9 h-9" />
        </div>

        <h2 className="empty-workspace-title">Your workspace is empty</h2>

        <p className="empty-workspace-desc">
          Get started by creating your first page. You can add documents, notes, project boards, or team wikis.
        </p>

        <button
          onClick={() => createPage(currentWorkspaceId)}
          className="empty-workspace-btn"
        >
          <FilePlus className="w-4 h-4" />
          Create first page
        </button>
      </div>
    </div>
  );
};
