import type { Metadata } from 'next';
import { TypographyLab } from '../../_ui/TypographyLab';

export const metadata: Metadata = { title: 'Typography' };

export default function Page() {
	return <TypographyLab />;
}
