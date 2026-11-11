/*
 * Voice settings belong to the person running the copy: only requests from that machine, to a local address, see or
 * change them. The host check keeps a page on another site from reaching them through DNS rebinding. Rules for a
 * public site come with publishing.
 */

import { addressOf } from '../security-log.ts';

export function isLoopback(ip: string | undefined): boolean {
	if (!ip) return false;
	const v4 = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
	return v4 === '::1' || /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(v4);
}

/** localhost, *.localhost, 127.x and [::1], with or without a port. */
export function isLocalHost(host: string | null): boolean {
	if (!host) return false;
	const name = host.startsWith('[') ? host.slice(0, host.indexOf(']') + 1) : host.replace(/:\d+$/, '');
	return name === 'localhost' || name.endsWith('.localhost') || name === '[::1]' || /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(name);
}

export function isLocalRequest(event: { request: Request; url: URL; getClientAddress: () => string }): boolean {
	return isLoopback(addressOf(event)) && isLocalHost(event.request.headers.get('host') ?? event.url.host);
}
