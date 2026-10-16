<script lang="ts">
	import { applyAction, enhance, type SubmitFunction } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { DATA_CATEGORIES, type DataCategory } from '#lib/data/categories.ts';
	import { forgetLocal } from '#lib/data/local.ts';
	import Seo from '#lib/site/Seo.svelte';
	import Field from '#lib/ui/Field.svelte';
	import RequiredNote from '#lib/ui/RequiredNote.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const errors = $derived((form?.errors ?? {}) as Record<string, string | undefined>);
	let confirming = $state(false);

	/** The category whose clearing is being confirmed, and the last one cleared. */
	let clearing = $state<DataCategory | null>(null);
	let cleared = $state<DataCategory | null>(null);
	let busy = $state(false);
	const clearError = $derived(form && 'category' in form && form.category === clearing ? (form.errors as Record<string, string>).password : undefined);

	const COUNT_TEXT: Record<DataCategory, (n: number) => string> = {
		learning: (n) => `${n} ${n === 1 ? 'lesson' : 'lessons'} completed`,
		practice: (n) => `${n} ${n === 1 ? 'result' : 'results'}`,
		ranked: (n) => `${n} ranked ${n === 1 ? 'result' : 'results'}`,
		fingermap: (n) => `${n} tagged ${n === 1 ? 'keystroke' : 'keystrokes'}`,
		usage: (n) => `Statistics from ${n} ${n === 1 ? 'device' : 'devices'}`
	};
	const title = (id: DataCategory) => DATA_CATEGORIES.find((c) => c.id === id)!.title;

	/** After the server clears a category, this browser's copy is discarded too. */
	const onClear: SubmitFunction = () => {
		busy = true;
		return async ({ result }) => {
			if (result.type === 'success' && result.data?.cleared) {
				const category = result.data.cleared as DataCategory;
				await forgetLocal(category, Number(result.data.at));
				cleared = category;
				clearing = null;
				await invalidateAll();
			} else {
				await applyAction(result);
			}
			busy = false;
		};
	};
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

	<section class="card" aria-labelledby="clear-title">
		<h2 id="clear-title">Clear part of your data</h2>
		<p class="text">
			Each kind of data can be cleared on its own; everything else stays exactly as it is. Clearing is permanent and
			applies to every device you use: copies kept in a browser are discarded on its next visit. Copies in backups
			disappear within 14 days.
		</p>
		{#if cleared}
			<p class="form-alert success" role="status">{title(cleared)} cleared. Everything else is unchanged.</p>
		{/if}
		<ul class="categories">
			{#each DATA_CATEGORIES as c (c.id)}
				{@const n = data.counts[c.id]}
				<li>
					<div class="category">
						<div class="about">
							<h3>{c.title}</h3>
							<p class="summary">{c.summary}</p>
							<p class="count">{n ? COUNT_TEXT[c.id](n) : 'Nothing stored'}</p>
						</div>
						{#if clearing !== c.id}
							<button class="btn" type="button" disabled={!n} onclick={() => (clearing = c.id)} aria-label={`Clear ${c.title.toLowerCase()}`}>Clear</button>
						{/if}
					</div>
					{#if clearing === c.id}
						<form method="POST" action="?/clear" class="confirm" use:enhance={onClear} novalidate>
							<p class="effect"><b>What happens:</b> {c.effect}</p>
							<input type="hidden" name="category" value={c.id} />
							<Field label="Password" name="password" type="password" autocomplete="current-password" required error={clearError} />
							<div class="row">
								<button class="btn btn-danger" type="submit" disabled={busy}>{busy ? 'Clearing…' : `Clear ${c.title.toLowerCase()}`}</button>
								<button class="btn" type="button" onclick={() => (clearing = null)}>Cancel</button>
							</div>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
	</section>

	<section class="card" aria-labelledby="export-title">
		<h2 id="export-title">Download your data</h2>
		<p class="text">
			Download a copy of everything sqwer stores about your account, in JSON format: your email address, profile, profile
			picture, examination results, course progress, finger map, usage statistics, signed-in devices, security activity and
			which recovery codes have been used.
		</p>
		<a class="btn" href="/account/export" download>Download my data</a>
	</section>

	<section class="card danger" aria-labelledby="delete-title">
		<h2 id="delete-title">Delete your account</h2>
		<p class="text">
			Deleting your account permanently removes everything stored with it: profile, profile picture, examination results,
			course progress, finger map, usage statistics, recovery codes, signed-in devices and security activity. Copies in
			backups disappear within 14 days. This cannot be undone. Data stored only in this browser is not affected.
		</p>
		{#if confirming || form?.errors}
			<form method="POST" action="?/delete" class="form" use:enhance novalidate>
				<RequiredNote />
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
	.categories {
		width: 100%;
		list-style: none;
		padding: 0;
		margin: 0;
		border-top: 1px solid var(--line);
	}
	.categories li {
		padding: 16px 0;
		border-bottom: 1px solid var(--line);
	}
	.category {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}
	.about h3 {
		font-size: 16px;
		font-weight: 600;
	}
	.summary {
		max-width: 600px;
		margin-top: 2px;
		font-size: 14px;
		line-height: 1.5;
		color: var(--ink-2);
	}
	.count {
		margin-top: 4px;
		font-size: 13px;
		font-weight: 600;
		color: var(--ink-3);
		font-variant-numeric: tabular-nums;
	}
	.confirm {
		max-width: 440px;
		margin-top: 12px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.effect {
		font-size: 14px;
		line-height: 1.5;
		color: var(--ink-2);
	}
	.effect b {
		color: var(--ink);
	}
	@media (max-width: 560px) {
		.category {
			flex-direction: column;
			align-items: flex-start;
		}
	}
	.row {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
</style>
