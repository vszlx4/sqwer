import type { Metadata } from 'next';
import { Shell } from '../_ui/Shell';

export const metadata: Metadata = { title: { default: 'Atlas', template: '%s · Atlas' }, description: 'A design exploration lab: styles, components, type, colour, motion and a mixer.' };

export default function StudioLayout({ children }: LayoutProps<'/lab'>) {
	return <Shell>{children}</Shell>;
}
