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
		gap: 14px;
	}
	.warning {
		padding: 12px 14px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		border-left: 4px solid var(--accent);
		background: var(--bg);
		font-size: 14.5px;
		line-height: 1.55;
		color: var(--ink);
	}
	.codes {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
	}
	.codes li {
		padding: 10px 12px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--bg);
		text-align: center;
	}
	code {
		font-family: var(--font-sans);
		font-size: 15px;
		font-weight: 600;
		letter-spacing: 0.06em;
		color: var(--ink);
		font-variant-numeric: tabular-nums;
	}
	.actions {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.status {
		min-height: 1px;
		font-size: 13px;
		color: var(--ink-2);
	}
	@media (max-width: 420px) {
		.codes {
			grid-template-columns: 1fr;
		}
	}
</style>
