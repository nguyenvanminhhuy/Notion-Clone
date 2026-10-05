import { AppShell } from '../../src/components/layout/AppShell';
import { CommandPalette } from '../../src/components/shared/CommandPalette';
import { UploadDialog } from '../../src/components/shared/UploadDialog';
import { ShareDialog } from '../../src/features/sharing/ShareDialog';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      {children}
      <CommandPalette />
      <UploadDialog />
      <ShareDialog />
    </AppShell>
  );
}
