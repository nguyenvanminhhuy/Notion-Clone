'use client';

import React from 'react';
import { PageView } from '../../../../src/features/page/PageView';
import { useRouter } from 'next/navigation';

interface PageRouteProps {
  params: Promise<{
    pageId: string;
  }>;
}

export default function PageRoute({ params }: PageRouteProps) {
  const router = useRouter();
  const { pageId } = React.use(params);

  return (
    <PageView
      pageId={pageId}
      onBackToDashboard={() => router.push('/')}
    />
  );
}
