import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlueprintView } from '../../../_ui/Blueprints';
import { BLUEPRINT_META as BLUEPRINTS } from '../../../_engine/blueprints';

const BLUEPRINT_BY_ID = Object.fromEntries(BLUEPRINTS.map((b) => [b.id, b]));

export function generateStaticParams() {
	return BLUEPRINTS.map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }: PageProps<'/lab/blueprints/[id]'>): Promise<Metadata> {
	const { id } = await params;
	return { title: BLUEPRINT_BY_ID[id]?.name ?? 'Blueprint' };
}

export default async function BlueprintPage({ params }: PageProps<'/lab/blueprints/[id]'>) {
	const { id } = await params;
	if (!BLUEPRINT_BY_ID[id]) notFound();
	return <BlueprintView id={id} />;
}
