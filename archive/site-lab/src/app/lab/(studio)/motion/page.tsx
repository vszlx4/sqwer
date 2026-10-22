import type { Metadata } from 'next';
import { MotionLab } from '../../_ui/MotionLab';

export const metadata: Metadata = { title: 'Motion' };

export default function Page() {
	return <MotionLab />;
}
