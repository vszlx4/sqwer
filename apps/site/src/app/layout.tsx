import type { Metadata, Viewport } from 'next';
import { alteraSerif, geistMono, neueMontreal } from './fonts';
import { themeScript } from '@/lib/theme';
import { SmoothScroll } from '@/components/providers/SmoothScroll';
import { WorkspaceBar } from '@/components/site/WorkspaceBar';
import './globals.css';

export const metadata: Metadata = {
	metadataBase: new URL(process.env.PUBLIC_SITE_URL ?? 'http://localhost:3100'),
	title: { default: 'sqwer', template: '%s · sqwer' },
	description: 'A typing course that learns which finger you actually use for each key.',
	// Design workspace for the new site: kept out of search engines until it replaces apps/web.
	robots: { index: false, follow: false }
};

export const viewport: Viewport = {
	colorScheme: 'light dark',
	themeColor: [
		{ media: '(prefers-color-scheme: light)', color: '#FBFAF4' },
		{ media: '(prefers-color-scheme: dark)', color: '#000000' }
	]
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
	return (
		<html
			lang="en-GB"
			data-theme="light"
			suppressHydrationWarning
			className={`${alteraSerif.variable} ${neueMontreal.variable} ${geistMono.variable}`}
		>
			<head>
				<script dangerouslySetInnerHTML={{ __html: themeScript }} />
			</head>
			<body>
				<SmoothScroll>
					{children}
					<WorkspaceBar />
				</SmoothScroll>
			</body>
		</html>
	);
}
