'use client';

import React, { useEffect } from 'react';
import { AppShell } from '../src/components/layout/AppShell';
import { HomeDashboard } from '../src/features/home/HomeDashboard';
import { usePageStore } from '../src/stores/pageStore';

export default function RootPage() {
  const { selectPage } = usePageStore();

  useEffect(() => {
    // Reset selected page when returning to Home Dashboard
    selectPage(null);
  }, [selectPage]);

  return (
    <AppShell>
      <HomeDashboard />
    </AppShell>
  );
}
