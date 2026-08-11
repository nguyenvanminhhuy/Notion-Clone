import { AppShell } from '../src/components/layout/AppShell';
import { HomeDashboard } from '../src/features/home/HomeDashboard';

export default function RootPage() {
  return (
    <AppShell>
      <HomeDashboard />
    </AppShell>
  );
}
