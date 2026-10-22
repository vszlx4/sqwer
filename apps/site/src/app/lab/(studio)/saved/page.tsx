import type { Metadata } from 'next';
import { SavedView } from '../../_ui/SavedView';
import { PageHead } from '../../_ui/kit';

export const metadata: Metadata = { title: 'Saved' };

export default function SavedPage() {
	return (
		<main className="lab-page">
			<PageHead kicker="12 · Make" title={<>Your <em>library</em>.</>} lead="Saved designs, collections and favourites live in this browser. Compare up to four directions side by side, and export everything as one JSON file you can import anywhere." />
			<SavedView />
		</main>
	);
}
