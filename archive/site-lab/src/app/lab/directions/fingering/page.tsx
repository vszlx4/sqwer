import type { Metadata } from 'next';
import { Fingering } from './Fingering';

export const metadata: Metadata = { title: 'Fingering · Lab' };

export default function FingeringPage() {
	return <Fingering />;
}
