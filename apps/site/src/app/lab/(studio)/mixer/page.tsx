import type { Metadata } from 'next';
import { Studio } from '../../_ui/Studio';

export const metadata: Metadata = { title: 'Design mixer' };

export default function MixerPage() {
	return <Studio mode="mixer" />;
}
