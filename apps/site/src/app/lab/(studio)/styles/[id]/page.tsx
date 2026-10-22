import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StyleDetail } from '../../../_ui/StyleGallery';
import { WORLDS, WORLD_BY_ID } from '../../../_engine/worlds';

export function generateStaticParams() {
  return WORLDS.map((w) => ({ id: w.id }));
}

export async function generateMetadata({ params }: PageProps<'/lab/styles/[id]'>): Promise<Metadata> {
  const { id } = await params;
  return { title: WORLD_BY_ID[id]?.name ?? 'Style' };
}

export default async function StylePage({ params }: PageProps<'/lab/styles/[id]'>) {
  const { id } = await params;
  if (!WORLD_BY_ID[id]) notFound();
  return <StyleDetail id={id} />;
}
