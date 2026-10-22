import type { Metadata } from 'next';
import { BlueprintGallery } from '../../_ui/Blueprints';
import { PageHead } from '../../_ui/kit';

export const metadata: Metadata = { title: 'Page blueprints' };

export default function BlueprintsPage() {
	return (
		<main>
			<div style={{ padding: 'clamp(20px, 3.2vw, 52px) clamp(20px, 3.2vw, 52px) 0' }}>
				<PageHead kicker="02 · Explore" title={<>Ten kinds of <em>page</em>, one design.</>} lead="Landing, portfolio, editorial, course, product, storefront, agency, restaurant, event and documentation. Each is a full structure with working interactions, drawn in whichever design you are currently working on." />
			</div>
			<BlueprintGallery />
		</main>
	);
}
