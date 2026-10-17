import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			// The public origin. It is the trusted origin for CSRF checks on form
			// submissions, so it must match the address users visit.
			paths: { origin: (process.env.PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '') },
			// Content Security Policy: only sqwer's own resources may load. Scripts need a per-response
			// nonce or hash, which SvelteKit adds to its own; inline styles are used by Svelte components.
			csp: {
				mode: 'auto',
				directives: {
					'default-src': ['self'],
					// Cloudflare Turnstile, used for bot protection when it is configured.
					'script-src': ['self', 'https://challenges.cloudflare.com'],
					'frame-src': ['https://challenges.cloudflare.com'],
					'style-src': ['self', 'unsafe-inline'],
					'img-src': ['self', 'data:', 'blob:'],
					'font-src': ['self'],
					'connect-src': ['self'],
					'worker-src': ['self', 'blob:'],
					'media-src': ['self'],
					'object-src': ['none'],
					'base-uri': ['self'],
					'form-action': ['self'],
					'frame-ancestors': ['none']
				}
			}
		})
	]
});
