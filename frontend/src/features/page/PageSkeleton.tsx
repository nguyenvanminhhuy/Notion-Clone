'use client';

import React from 'react';
import { SkeletonBlock } from '../../components/shared/SkeletonBlock';

export const PageSkeleton: React.FC = () => {
  return (
    <div className="page-skeleton-container" aria-label="Loading page content...">
      {/* Cover Skeleton */}
      <SkeletonBlock height={140} borderRadius={12} className="page-skeleton-cover" />

      {/* Header Skeleton */}
      <div className="page-skeleton-header">
        <SkeletonBlock width={64} height={64} borderRadius={12} className="page-skeleton-icon" />
        <SkeletonBlock width="55%" height={36} borderRadius={8} className="page-skeleton-title" />
      </div>

      {/* Body Line Skeletons */}
      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SkeletonBlock width="90%" height={18} />
        <SkeletonBlock width="100%" height={18} />
        <SkeletonBlock width="75%" height={18} />
        <SkeletonBlock width="85%" height={18} />
      </div>

      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SkeletonBlock width="40%" height={24} borderRadius={6} />
        <SkeletonBlock width="95%" height={18} />
        <SkeletonBlock width="80%" height={18} />
      </div>
    </div>
  );
};
