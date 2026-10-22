import localFont from 'next/font/local';

// PP Altera Serif for h1 and h2, PP Neue Montreal for everything else, Geist Mono for typing text.
// All self-hosted from src/fonts; the PP families are licensed by the project owner.

export const alteraSerif = localFont({
	variable: '--font-altera-serif',
	display: 'swap',
	src: [
		{ path: '../fonts/PPAlteraSerif-Thin.woff2', weight: '100', style: 'normal' },
		{ path: '../fonts/PPAlteraSerif-Regular.woff2', weight: '400', style: 'normal' },
		{ path: '../fonts/PPAlteraSerif-Extrabold.woff2', weight: '800', style: 'normal' }
	]
});

export const neueMontreal = localFont({
	variable: '--font-neue-montreal',
	display: 'swap',
	src: [
		{ path: '../fonts/PPNeueMontreal-Hairline.woff2', weight: '100', style: 'normal' },
		{ path: '../fonts/PPNeueMontreal-HairlineItalic.woff2', weight: '100', style: 'italic' },
		{ path: '../fonts/PPNeueMontreal-Light.woff2', weight: '300', style: 'normal' },
		{ path: '../fonts/PPNeueMontreal-LightItalic.woff2', weight: '300', style: 'italic' },
		{ path: '../fonts/PPNeueMontreal-Regular.woff2', weight: '400', style: 'normal' },
		{ path: '../fonts/PPNeueMontreal-Italic.woff2', weight: '400', style: 'italic' },
		{ path: '../fonts/PPNeueMontreal-Semibold.woff2', weight: '600', style: 'normal' },
		{ path: '../fonts/PPNeueMontreal-SemiboldItalic.woff2', weight: '600', style: 'italic' },
		{ path: '../fonts/PPNeueMontreal-Extrabold.woff2', weight: '800', style: 'normal' },
		{ path: '../fonts/PPNeueMontreal-ExtraboldItalic.woff2', weight: '800', style: 'italic' }
	]
});

export const geistMono = localFont({
	variable: '--font-geist-mono',
	display: 'swap',
	weight: '100 900',
	src: '../fonts/GeistMono-Variable.woff2'
});
