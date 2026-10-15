import { SITE_URL } from '#lib/server/config.ts';
import { LEGAL_DOCUMENTS } from '#lib/site/legal.ts';
import { CONTACT_EMAIL } from '#lib/site/links.ts';
import type { RequestHandler } from './$types';

/** Security contact (RFC 9116). Valid for one year from the security policy's effective date; renew it with the policy. */
const EXPIRES = new Date(Date.parse(LEGAL_DOCUMENTS.security.effectiveIso) + 365 * 24 * 60 * 60 * 1000).toISOString();

export const GET: RequestHandler = () =>
	new Response(
		[
			`Contact: mailto:${CONTACT_EMAIL}`,
			`Expires: ${EXPIRES}`,
			'Preferred-Languages: en, ar',
			`Canonical: ${SITE_URL}/.well-known/security.txt`,
			`Policy: ${SITE_URL}${LEGAL_DOCUMENTS.security.href}`,
			''
		].join('\n'),
		{ headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' } }
	);
