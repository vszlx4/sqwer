import { Score } from '@/components/landing/Score';
import { LitProvider } from '@/components/landing/lit';
import { Begin, Grow, HandsPanel, Header, Opening, Practise, ScorePanels, Tempo, Technique } from '@/components/landing/panels';

// The landing page: one score. See .impeccable/surfaces/src-app-page-tsx.md for the direction contract.

export default function Home() {
	return (
		<LitProvider>
			<Header />
			<main id="content">
				<Score>
					<Opening />
					<HandsPanel />
					<ScorePanels />
					<Practise />
					<Grow />
					<Technique />
					<Tempo />
					<Begin />
				</Score>
			</main>
		</LitProvider>
	);
}
