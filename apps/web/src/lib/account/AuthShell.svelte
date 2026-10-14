<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, lede, children, footer }: { title: string; lede?: string; children: Snippet; footer?: Snippet } = $props();
</script>

<section class="auth" aria-labelledby="auth-title">
	<div class="card">
		<h1 id="auth-title">{title}</h1>
		{#if lede}<p class="lede">{lede}</p>{/if}
		{@render children()}
	</div>
	{#if footer}<div class="footer">{@render footer()}</div>{/if}
</section>

<style>
	.auth {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 18px;
		padding: clamp(8px, 4vh, 40px) 0;
	}
	.card {
		width: 100%;
		max-width: 480px;
		padding: clamp(22px, 4vw, 36px);
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--surface);
		display: flex;
		flex-direction: column;
		gap: 18px;
	}
	h1 {
		font-size: clamp(30px, 4vw, 40px);
		line-height: 1.1;
		letter-spacing: -0.01em;
	}
	.lede {
		margin-top: -8px;
		font-size: 15.5px;
		line-height: 1.55;
		color: var(--ink-2);
	}
	.footer {
		font-size: 14.5px;
		color: var(--ink-2);
		text-align: center;
	}
	.footer :global(a) {
		color: var(--ink);
		font-weight: 600;
		text-decoration: none;
	}
</style>
