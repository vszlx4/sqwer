import type { Metadata } from 'next';
import { StyleGallery } from '../../_ui/StyleGallery';
import { PageHead } from '../../_ui/kit';

export const metadata: Metadata = { title: 'Style gallery' };

export default function StylesPage() {
  return (
    <main className="lab-page">
      <PageHead kicker="01 · Explore" title={<>Complete <em>worlds</em>, each with its own habits.</>} lead="Every tile is the same landing page drawn by the same engine, under a different complete design. Filter by family, search, favourite, or open one full size and mix from it." />
      <StyleGallery />
    </main>
  );
}
