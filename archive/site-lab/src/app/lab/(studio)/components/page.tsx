import type { Metadata } from 'next';
import { ComponentLab } from '../../_ui/ComponentLab';

export const metadata: Metadata = { title: 'Component lab' };

export default function Page() {
	return <ComponentLab />;
}
