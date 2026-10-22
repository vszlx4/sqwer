import type { Metadata } from 'next';
import { AssetLab } from '../../_ui/AssetLab';

export const metadata: Metadata = { title: 'Assets' };

export default function Page() {
	return <AssetLab />;
}
