import { Reading } from '@/components/landing/Reading';
import { Rise } from '@/components/landing/Rise';
import { World } from '@/components/landing/World';
import { Begin, Chapters, Games, Grow, HandsPanel, Header, Opening, Practise, Technique, Tempo } from '@/components/landing/panels';
import '@/components/landing/landing.css';

// The landing page. See .impeccable/surfaces/src-app-page-tsx.md for the direction contract.

export default function Home() {
	return (
		<>
			<Header />
			<main id="content">
				<Opening />
				<HandsPanel />
				<Reading />
				<World />
				<Chapters />
				<Practise />
				<Games />
				<Grow />
				<Technique />
				<Tempo />
				<Begin />
			</main>
			<Rise />
		</>
	);
}
