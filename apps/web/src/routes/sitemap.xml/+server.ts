import { SITE_URL } from '#lib/server/config.ts';
import type { RequestHandler } from './$types';

const PAGES = ['/', '/exams', '/map', '/about', '/faq', '/signup', '/signin', '/privacy', '/terms', '/cookies'];

export const GET: RequestHandler = () => {
	const urls = PAGES.map((p) => `  <url><loc>${SITE_URL}${p}</loc></url>`).join('\n');
	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
		{ headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } }
	);
};
