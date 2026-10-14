import { SITE_URL } from '#lib/server/config.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () =>
	new Response(
		[
			'User-agent: *',
			'Allow: /',
			'Disallow: /account',
			'Disallow: /api/',
			'Disallow: /u/',
			'Disallow: /signout',
			'',
			`Sitemap: ${SITE_URL}/sitemap.xml`,
			''
		].join('\n'),
		{ headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } }
	);
