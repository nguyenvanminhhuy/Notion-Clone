import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider, themeScript } from '../src/components/shared/ThemeProvider';
import { QueryProvider } from '../src/components/shared/QueryProvider';
import { ToastContainer } from '../src/components/shared/Toast';

export const metadata: Metadata = {
  title: 'Notion Clone — Knowledge Workspace with Demo AI',
  description:
    'A modern knowledge workspace with a clearly labeled deterministic Demo AI experience.',
  keywords: ['notion', 'notes', 'knowledge base', 'AI', 'productivity'],
  authors: [{ name: 'Notion Clone' }],
};

import { SkipToContent } from '../src/components/shared/SkipToContent';
import { ErrorBoundary } from '../src/components/shared/ErrorBoundary';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Anti-FOUC: apply theme before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <SkipToContent />
        <ErrorBoundary>
          <QueryProvider>
            <ThemeProvider>
              {children}
              <ToastContainer />
            </ThemeProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
