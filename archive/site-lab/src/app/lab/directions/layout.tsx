import Link from 'next/link';

// The chosen direction pages sit under the old lab path; this keeps a way back to the new lab.
export default function DirectionsLayout({ children }: LayoutProps<'/lab/directions'>) {
	return (
		<>
			<div style={{ position: 'fixed', left: 12, top: 12, zIndex: 60 }}>
				<Link href="/lab" className="rounded border border-line-strong bg-bg/85 px-3 py-1.5 text-[13px] font-semibold text-ink-2 backdrop-blur-md hover:text-ink">← Atlas lab</Link>
			</div>
			{children}
		</>
	);
}
