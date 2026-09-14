'use client';

import React from 'react';

interface SkeletonBlockProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const SkeletonBlock: React.FC<SkeletonBlockProps> = ({
  width = '100%',
  height = '16px',
  borderRadius,
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: borderRadius
          ? typeof borderRadius === 'number'
            ? `${borderRadius}px`
            : borderRadius
          : undefined,
        ...style,
      }}
      aria-hidden="true"
    />
  );
};
