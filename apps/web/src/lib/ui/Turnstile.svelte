<script lang="ts" module>
	interface TurnstileApi {
		render: (el: HTMLElement, opts: Record<string, unknown>) => string;
		reset: (id: string) => void;
		remove: (id: string) => void;
	}
	declare global {
		interface Window {
			turnstile?: TurnstileApi;
		}
	}

	let loading: Promise<TurnstileApi> | null = null;
	/** Loads Cloudflare's script once, when a form that needs it is first shown. */
	function loadTurnstile(): Promise<TurnstileApi> {
		if (window.turnstile) return Promise.resolve(window.turnstile);
		loading ??= new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
			script.async = true;
			script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile did not load')));
			script.onerror = () => {
				loading = null;
				reject(new Error('Turnstile could not be loaded'));
			};
			document.head.append(script);
		});
		return loading;
	}
</script>

<script lang="ts">
	import { onMount, untrack } from 'svelte';

	/**
	 * Cloudflare Turnstile, in managed mode: most visitors see a short automatic check, and only
	 * some are asked to click. The token goes into the form as `cf-turnstile-response` and is
	 * checked on the server. If the script cannot load or the check fails to run, `onfail` lets the
	 * page offer sqwer's own verification instead.
	 */
	interface Props {
		siteKey: string;
		action: string;
		/** Changes after each submission, because every token can be used once. */
		resetKey?: unknown;
		onfail: () => void;
	}
	let { siteKey, action, resetKey, onfail }: Props = $props();

	let box: HTMLDivElement | undefined = $state();
	let widget: string | null = null;
	let api: TurnstileApi | null = null;

	onMount(() => {
		let cancelled = false;
		loadTurnstile()
			.then((t) => {
				if (cancelled || !box) return;
				api = t;
				const dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
				widget = t.render(box, {
					sitekey: siteKey,
					action,
					theme: dark ? 'dark' : 'light',
					size: 'flexible',
					'response-field-name': 'cf-turnstile-response',
					'refresh-expired': 'auto',
					'error-callback': () => {
						onfail();
						return true;
					}
				});
			})
			.catch(() => !cancelled && onfail());
		return () => {
			cancelled = true;
			if (widget && api) api.remove(widget);
		};
	});

	// A new token after every submission.
	$effect(() => {
		void resetKey;
		untrack(() => {
			if (widget && api) api.reset(widget);
		});
	});
</script>

<div class="turnstile" bind:this={box}></div>

<style>
	.turnstile {
		min-height: 65px;
	}
</style>
