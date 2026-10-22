import { LitProvider } from '@/components/landing/lit';
import { Reading } from '@/components/landing/Reading';
import { Rise } from '@/components/landing/Rise';
import { Begin, Chapters, Grow, HandsPanel, Header, Opening, Practise, Technique, Tempo } from '@/components/landing/panels';
import '@/components/landing/landing.css';

// The landing page. See .impeccable/surfaces/src-app-page-tsx.md for the direction contract.

export default function Home() {
	return (
		<LitProvider>
			<Header />
			<main id="content">
				<Opening />
				<HandsPanel />
				<Chapters />
				<Reading />
				<Practise />
				<Grow />
				<Technique />
				<Tempo />
				<Begin />
			</main>
			<Rise />
		</LitProvider>
	);
}
