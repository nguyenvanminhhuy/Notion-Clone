'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import { shareService, type PublicPage } from '../../services/shareService';

const Editor = lazy(() =>
  import('../editor/Editor').then((module) => ({ default: module.Editor }))
);

export function PublicPageView({ pageId }: { pageId: string }) {
  const [page, setPage] = useState<PublicPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    shareService.getPublicPage(pageId)
      .then(setPage)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [pageId]);

  if (loading) return <main className="public-page-state">Loading public page…</main>;
  if (notFound || !page) {
    return (
      <main className="public-page-state">
        <h1>Page not available</h1>
        <p>This page is private, disabled, or no longer exists.</p>
      </main>
    );
  }

  return (
    <main id="main-content" className="public-page-shell">
      {page.cover && <div className="public-page-cover" style={{ backgroundImage: `url(${page.cover})` }} />}
      <article className="public-page-document">
        {page.icon && <div className="public-page-icon" aria-hidden="true">{page.icon}</div>}
        <h1>{page.title || 'Untitled'}</h1>
        <p className="public-page-updated">Updated {new Date(page.updatedAt).toLocaleDateString()}</p>
        <Suspense fallback={<p>Loading content…</p>}>
          <Editor initialContent={page.content} editable={false} onSave={async () => {}} />
        </Suspense>
      </article>
    </main>
  );
}
