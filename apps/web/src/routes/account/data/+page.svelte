<script lang="ts">
	import { enhance } from '$app/forms';
	import Seo from '#lib/site/Seo.svelte';
	import Field from '#lib/ui/Field.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const errors = $derived((form?.errors ?? {}) as Record<string, string | undefined>);
	let confirming = $state(false);
</script>

<Seo title="Your data" description="Export or delete your sqwer account data." noindex />

<div class="stack">
	<h1>Your data</h1>

	<section class="card" aria-labelledby="sync-title">
		<h2 id="sync-title">Finger map sync</h2>
		<p class="text">
			{#if data.fingerMap.count}
				Your account holds {data.fingerMap.count} tagged keystrokes, last updated
				{new Date(data.fingerMap.updatedAt!).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}. While you
				are signed in, changes to your finger map are saved to your account automatically.
			{:else}
				Your account does not hold any finger map data yet. While you are signed in, your finger map is saved to your
				account automatically.
			{/if}
		</p>
	</section>

	<section class="card" aria-labelledby="export-title">
		<h2 id="export-title">Download your data</h2>
		<p class="text">
			Download a copy of everything sqwer stores about your account: your email address, profile, profile picture,
			signed-in devices, results and finger map, in JSON format.
		</p>
		<a class="btn" href="/account/export" download>Download my data</a>
	</section>

	<section class="card danger" aria-labelledby="delete-title">
		<h2 id="delete-title">Delete your account</h2>
		<p class="text">
			Deleting your account permanently removes your profile, profile picture, results, recovery codes, signed-in devices
			and the finger map stored in your account. This cannot be undone. Data stored only in this browser is not affected.
		</p>
		{#if confirming || form?.errors}
			<form method="POST" action="?/delete" class="form" use:enhance novalidate>
				<Field label="Password" name="password" type="password" autocomplete="current-password" required error={errors.password} />
				<Field label="Type DELETE to confirm" name="confirm" autocomplete="off" required error={errors.confirm} />
				<div class="row">
					<button class="btn btn-danger" type="submit">Permanently delete my account</button>
					<button class="btn" type="button" onclick={() => (confirming = false)}>Cancel</button>
				</div>
			</form>
		{:else}
			<button class="btn" type="button" onclick={() => (confirming = true)}>Delete my account</button>
		{/if}
	</section>
</div>

<style>
	.stack {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}
	h1 {
		font-size: clamp(30px, 4vw, 42px);
	}
	.card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 14px;
		padding: 22px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	.card.danger {
		border-left: 4px solid var(--error);
	}
	h2 {
		font-size: 24px;
	}
	.text {
		max-width: 640px;
		font-size: 15px;
		line-height: 1.6;
		color: var(--ink-2);
	}
	.form {
		width: 100%;
		max-width: 440px;
	}
	.row {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
</style>
