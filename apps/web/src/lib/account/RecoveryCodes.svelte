<script lang="ts">
	let { codes, email }: { codes: string[]; email: string } = $props();
	let copied = $state(false);

	const text = $derived(
		`sqwer recovery codes for ${email}\nEach code can be used once to reset your password.\n\n${codes.join('\n')}\n`
	);

	async function copy() {
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			copied = false;
		}
	}

	function download() {
		const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
		const a = document.createElement('a');
		a.href = url;
		a.download = 'sqwer-recovery-codes.txt';
		a.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}
</script>

<div class="codes-box">
	<p class="warning">
		Store these recovery codes in a safe place. They are the only way to reset your password, and they will not be
		shown again. Each code can be used once.
	</p>
	<ol class="codes" aria-label="Recovery codes">
		{#each codes as code (code)}
			<li><code>{code}</code></li>
		{/each}
	</ol>
	<div class="actions">
		<button type="button" class="btn" onclick={download}>Download codes</button>
		<button type="button" class="btn" onclick={copy}>{copied ? 'Copied' : 'Copy codes'}</button>
	</div>
	<p class="status" aria-live="polite">{copied ? 'The recovery codes have been copied to your clipboard.' : ''}</p>
</div>

<style>
	.codes-box {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
	}
	.warning {
		padding: var(--space-12) var(--space-16);
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		border-left: 4px solid var(--accent);
		background: var(--bg);
		font-size: var(--fs-15);
		line-height: var(--lh-body);
		color: var(--ink);
	}
	.codes {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-8);
	}
	.codes li {
		padding: var(--space-10) var(--space-12);
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--bg);
		text-align: center;
	}
	code {
		font-family: var(--font-sans);
		font-size: var(--fs-15);
		font-weight: var(--fw-semibold);
		letter-spacing: var(--tr-wide);
		color: var(--ink);
		font-variant-numeric: tabular-nums;
	}
	.actions {
		display: flex;
		gap: var(--space-8);
		flex-wrap: wrap;
	}
	.status {
		min-height: 1px;
		font-size: var(--fs-13);
		color: var(--ink-2);
	}
	@media (max-width: 420px) {
		.codes {
			grid-template-columns: 1fr;
		}
	}
</style>
