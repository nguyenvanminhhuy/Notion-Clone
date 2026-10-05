import { PublicPageView } from '../../../src/features/public/PublicPageView';

export default async function PublicPage({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;
  return <PublicPageView pageId={pageId} />;
}
