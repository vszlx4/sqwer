import type { Metadata } from 'next';
import { ColourLab } from '../../_ui/ColourLab';

export const metadata: Metadata = { title: 'Colour' };

export default function Page() {
	return <ColourLab />;
}
