import type { Metadata } from 'next';
import { LayoutLab } from '../../_ui/LayoutLab';

export const metadata: Metadata = { title: 'Layouts' };

export default function Page() {
	return <LayoutLab />;
}
