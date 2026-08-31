import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider, themeScript } from '../src/components/shared/ThemeProvider';
import { QueryProvider } from '../src/components/shared/QueryProvider';
import { ToastContainer } from '../src/components/shared/Toast';
import { CommandPalette } from '../src/components/shared/CommandPalette';

export const metadata: Metadata = {
  title: 'Notion Clone — AI-Powered Knowledge Workspace',
  description:
    'A modern, AI-powered knowledge workspace. Organize your notes, projects, and ideas in one place.',
  keywords: ['notion', 'notes', 'knowledge base', 'AI', 'productivity'],
  authors: [{ name: 'Notion Clone' }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Anti-FOUC: apply theme before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <QueryProvider>
          <ThemeProvider>
            {children}
            <ToastContainer />
            <CommandPalette />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
