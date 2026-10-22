import type { Metadata } from 'next';
import { Studio } from '../../_ui/Studio';

export const metadata: Metadata = { title: 'Workbench' };

export default function WorkbenchPage() {
	return <Studio mode="workbench" />;
}
