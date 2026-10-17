<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import Icon from './Icon.svelte';

	/**
	 * sqwer's verification. A proof-of-work check runs in the background while the person types the
	 * characters shown, or answers a text question instead. `resetKey` changes after each submission,
	 * because every challenge can be used only once.
	 */
	interface Props {
		error?: string | null;
		resetKey?: unknown;
		/** The form this verification is for; the server accepts it for that form only. */
		action: 'signin' | 'signup' | 'reset';
		/** Shown in place of Turnstile, when that could not run. */
		fallback?: boolean;
	}
	let { error = null, resetKey, action, fallback = false }: Props = $props();

	interface Pow {
		parameters: Record<string, unknown>;
		signature?: string;
	}
	interface Challenge {
		kind: 'image' | 'text';
		token: string;
		svg?: string;
		question?: string;
	}

	const uid = $props.id();
	let kind = $state<'image' | 'text'>('image');
	let challenge = $state<Challenge | null>(null);
	let payload = $state('');
	let status = $state<'loading' | 'working' | 'done' | 'failed'>('loading');
	let answer = $state('');
	let root: HTMLFieldSetElement | undefined = $state();
	let answerInput: HTMLInputElement | undefined = $state();
	let controller: AbortController | null = null;
	let pending: Promise<void> | null = null;

	async function solve(pow: Pow, ctrl: AbortController) {
		const [{ solveChallenge }, { deriveKey }] = await Promise.all([import('altcha-lib'), import('altcha-lib/algorithms/web/pbkdf2')]);
		const solution = await solveChallenge({ challenge: pow as never, deriveKey, controller: ctrl });
		if (ctrl.signal.aborted) return;
		if (!solution) {
			status = 'failed';
			return;
		}
		payload = btoa(JSON.stringify({ challenge: { parameters: pow.parameters, signature: pow.signature }, solution }));
		status = 'done';
	}

	async function load(focus = false) {
		controller?.abort();
		const ctrl = (controller = new AbortController());
		status = 'loading';
		challenge = null;
		answer = '';
		payload = '';
		try {
			const res = await fetch(`/api/captcha?kind=${kind}&action=${action}`, { signal: ctrl.signal, cache: 'no-store' });
			if (!res.ok) throw new Error(String(res.status));
			const data = (await res.json()) as { pow: Pow; challenge: Challenge };
			challenge = data.challenge;
			status = 'working';
			pending = solve(data.pow, ctrl).catch(() => {
				if (!ctrl.signal.aborted) status = 'failed';
			});
			if (focus) requestAnimationFrame(() => answerInput?.focus());
		} catch {
			if (!ctrl.signal.aborted) status = 'failed';
		}
	}

	function switchKind() {
		kind = kind === 'image' ? 'text' : 'image';
		void load(true);
	}

	// A new challenge on first display and after every submission.
	$effect(() => {
		void resetKey;
		untrack(() => void load());
	});

	onMount(() => {
		const form = root?.closest('form');
		if (!form) return;
		// If the background check is still running when the form is sent, wait for it, then send.
		const onsubmit = (e: SubmitEvent) => {
			if (status !== 'working' || !pending) return;
			e.preventDefault();
			e.stopImmediatePropagation();
			const submitter = e.submitter as HTMLElement | null;
			void pending.then(() => {
				if (status === 'done') form.requestSubmit(submitter ?? undefined);
			});
		};
		form.addEventListener('submit', onsubmit, { capture: true });
		return () => {
			form.removeEventListener('submit', onsubmit, { capture: true });
			controller?.abort();
		};
	});

	const STATUS = {
		loading: 'Preparing the verification…',
		working: 'Checking this browser in the background…',
		done: 'Browser check complete.',
		failed: 'The verification could not be prepared. Choose “New challenge” to try again.'
	} as const;
</script>

<fieldset class="captcha" class:invalid={!!error} bind:this={root} aria-describedby={`${uid}-about`}>
	<legend>Verification<span class="req" aria-hidden="true"></span></legend>
	<div class="panel">
		<p class="instruction" id={`${uid}-instruction`}>
			{kind === 'image'
				? 'Type the characters shown in the image. Letters are not case-sensitive.'
				: 'Answer the question below.'}
		</p>
		<div class="stage">
			{#if kind === 'image'}
				<div
					class="image"
					role="img"
					aria-label="Distorted characters to type. If you cannot read them, choose “Use a text question”."
				>
					{#if challenge?.svg && challenge.kind === 'image'}
						<!-- Generated on sqwer's server from fixed shapes; it never contains user input. -->
						{@html challenge.svg}
					{:else}
						<span class="placeholder">{status === 'failed' ? 'Not available' : 'Loading…'}</span>
					{/if}
				</div>
			{:else}
				<p class="question" id={`${uid}-question`}>
					{challenge?.kind === 'text' ? challenge.question : status === 'failed' ? 'Not available' : 'Loading…'}
				</p>
			{/if}
			<div class="tools">
				<button type="button" class="tool" onclick={() => load(true)}>
					<Icon name="repeat" size={16} /> New challenge
				</button>
				<button type="button" class="tool" onclick={switchKind}>
					<Icon name={kind === 'image' ? 'text' : 'eye'} size={16} />
					{kind === 'image' ? 'Use a text question' : 'Use an image instead'}
				</button>
			</div>
		</div>

		<div class="answer" class:characters={kind === 'image'}>
			<label for={`${uid}-answer`}>
				{kind === 'image' ? 'Characters' : 'Your answer'}<span class="req" aria-hidden="true"></span>
			</label>
			<input
				bind:this={answerInput}
				bind:value={answer}
				id={`${uid}-answer`}
				name="captchaAnswer"
				type="text"
				required
				maxlength={40}
				autocomplete="off"
				autocapitalize="off"
				spellcheck="false"
				aria-invalid={error ? 'true' : undefined}
				aria-describedby={[`${uid}-instruction`, kind === 'text' && `${uid}-question`, error && `${uid}-error`].filter(Boolean).join(' ')}
			/>
		</div>
		<input type="hidden" name="captchaToken" value={challenge?.token ?? ''} />
		<input type="hidden" name="altcha" value={payload} />

		<p class="status" data-state={status} aria-live="polite">
			<span class="dot" aria-hidden="true"></span>{STATUS[status]}
		</p>
	</div>
	<noscript><p class="error">Verification requires JavaScript. Please enable it to continue.</p></noscript>
	{#if error}<p class="error" id={`${uid}-error`} role="alert">{error}</p>{/if}
	<p class="about" id={`${uid}-about`}>
		{fallback ? 'The usual check could not run, so sqwer is checking this itself.' : 'This check is run by sqwer itself.'} No third party is contacted and no cookie is set.
	</p>
</fieldset>

<style>
	.captcha {
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 0;
		margin: 0;
		padding: 0;
		border: 0;
	}
	legend {
		padding: 0;
		margin-bottom: 6px;
		font-size: 14.5px;
		font-weight: 600;
		color: var(--ink);
	}
	.panel {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 14px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--surface);
	}
	.invalid .panel {
		border-color: var(--error);
	}
	.instruction {
		font-size: 13.5px;
		color: var(--ink-2);
	}
	.stage {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 10px;
		align-items: stretch;
	}
	.image,
	.question {
		display: grid;
		place-items: center;
		min-height: 84px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background:
			repeating-linear-gradient(135deg, transparent 0 7px, color-mix(in srgb, var(--ink) 4%, transparent) 7px 8px),
			var(--bg);
		color: var(--ink);
		user-select: none;
	}
	.image :global(svg) {
		width: 100%;
		max-width: 280px;
		height: auto;
		display: block;
	}
	.question {
		padding: 12px 14px;
		font-size: 15.5px;
		font-weight: 600;
		line-height: 1.45;
		text-align: center;
		user-select: text;
	}
	.placeholder {
		font-size: 13.5px;
		color: var(--ink-2);
	}
	.tools {
		display: flex;
		flex-direction: column;
		gap: 6px;
		justify-content: center;
	}
	.tool {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 36px;
		padding: 0 10px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--bg);
		color: var(--ink);
		font: inherit;
		font-size: 13px;
		font-weight: 600;
		white-space: nowrap;
		cursor: pointer;
		transition: border-color 120ms ease;
	}
	.tool:hover {
		border-color: var(--ink);
	}
	.answer {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.answer label {
		font-size: 14px;
		font-weight: 600;
		color: var(--ink);
	}
	.answer input {
		width: 100%;
		min-height: 46px;
		padding: 10px 12px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--bg);
		color: var(--ink);
		font-family: var(--font-mono);
		font-size: 18px;
	}
	/* Characters are entered as they appear; case does not matter. */
	.answer.characters input {
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.answer input:focus-visible {
		border-color: var(--ink);
	}
	.invalid .answer input {
		border-color: var(--error);
	}
	.status {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12.5px;
		color: var(--ink-2);
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--ink-3);
		flex-shrink: 0;
	}
	[data-state='working'] .dot,
	[data-state='loading'] .dot {
		animation: pulse 1s ease-in-out infinite;
	}
	[data-state='done'] .dot {
		background: var(--accent);
		box-shadow: 0 0 0 1px var(--ink);
	}
	[data-state='failed'] .dot {
		background: var(--error);
	}
	@keyframes pulse {
		50% {
			opacity: 0.3;
		}
	}
	.about {
		font-size: 12.5px;
		color: var(--ink-2);
	}
	.error {
		font-size: 13.5px;
		font-weight: 600;
		color: var(--error);
	}
	@media (max-width: 480px) {
		.stage {
			grid-template-columns: 1fr;
		}
		.tools {
			flex-direction: row;
			flex-wrap: wrap;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.dot {
			animation: none !important;
		}
	}
</style>
