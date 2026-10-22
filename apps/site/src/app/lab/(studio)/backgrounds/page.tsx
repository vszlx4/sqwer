import type { Metadata } from 'next';
import { BackgroundLab } from '../../_ui/BackgroundLab';

export const metadata: Metadata = { title: 'Backgrounds' };

export default function Page() {
	return <BackgroundLab />;
}
