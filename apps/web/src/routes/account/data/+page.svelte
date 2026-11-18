<script lang="ts">
	import { applyAction, enhance, type SubmitFunction } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { DATA_CATEGORIES, type DataCategory } from '#lib/data/categories.ts';
	import { forgetLocal } from '#lib/data/local.ts';
	import PageHead from '#lib/account/PageHead.svelte';
	import SettingRow from '#lib/account/SettingRow.svelte';
	import SettingsSection from '#lib/account/SettingsSection.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import Field from '#lib/ui/Field.svelte';
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

<PageHead title="Your data" line="What sqwer keeps for your account. Download it, clear part of it or delete it all." />

<div class="panels">
	<SettingsSection title="Download" flush>
		<SettingRow label="All your data" hint="One JSON file: profile, picture, results, progress, finger map, statistics, devices and activity.">
			<a class="btn" href="/account/export" download><Icon name="download" size={16} /> Download my data</a>
		</SettingRow>
	</SettingsSection>

	<SettingsSection title="Stored data" description="Clear one kind; the rest stays. Permanent, on every device." flush>
		{#if cleared}<p class="form-alert success inset-alert" role="status">{title(cleared)} cleared. Everything else is unchanged.</p>{/if}
		{#each DATA_CATEGORIES as c (c.id)}
			{@const n = data.counts[c.id]}
			<section class="category" aria-label={c.title}>
			<SettingRow label={c.title} hint={n ? COUNT_TEXT[c.id](n) : 'Nothing stored'}>
				{#if clearing !== c.id}
					<button class="btn" type="button" disabled={!n} onclick={() => (clearing = c.id)} aria-label={`Clear ${c.title.toLowerCase()}`}>Clear</button>
				{/if}
			</SettingRow>
			{#if clearing === c.id}
				<form method="POST" action="?/clear" class="confirm" use:enhance={onClear} novalidate>
					<p class="effect">{c.summary}</p>
					<p class="effect"><b>After clearing:</b> {c.effect}</p>
					<input type="hidden" name="category" value={c.id} />
					<Field label="Password" name="password" type="password" autocomplete="current-password" required error={clearError} />
					<div class="buttons">
						<button class="btn btn-danger" type="submit" disabled={busy}>{busy ? 'Clearing…' : `Clear ${c.title.toLowerCase()}`}</button>
						<button class="btn" type="button" onclick={() => (clearing = null)}>Cancel</button>
					</div>
				</form>
			{/if}
			</section>
		{/each}
	</SettingsSection>

	<SettingsSection title="Delete account" danger flush>
		<SettingRow label="Delete your account" hint="Removes everything stored with it. Backups clear within 14 days. Can't be undone.">
			{#if !(confirming || form?.errors)}
				<button class="btn" type="button" onclick={() => (confirming = true)}>Delete my account</button>
			{/if}
		</SettingRow>
		{#if confirming || form?.errors}
			<form method="POST" action="?/delete" class="confirm" use:enhance novalidate>
				<p class="effect">Data kept only in this browser is not affected.</p>
				<Field label="Password" name="password" type="password" autocomplete="current-password" required error={errors.password} />
				<Field label="Type DELETE to confirm" name="confirm" autocomplete="off" required error={errors.confirm} />
				<div class="buttons">
					<button class="btn btn-danger" type="submit">Permanently delete my account</button>
					<button class="btn" type="button" onclick={() => (confirming = false)}>Cancel</button>
				</div>
			</form>
		{/if}
	</SettingsSection>
</div>

<style>
	.panels {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
	}
	.category + .category {
		border-top: 1px solid var(--line);
	}
	.inset-alert {
		margin: var(--space-16) var(--space-20) 0;
	}
	.confirm {
		display: flex;
		flex-direction: column;
		gap: var(--space-12);
		max-width: calc(var(--w-form) + 2 * var(--space-20)); /* off-scale: form width plus the row padding */
		padding: 0 var(--space-20) var(--space-20);
	}
	.effect {
		font-size: var(--fs-14);
		line-height: var(--lh-body);
		color: var(--ink-2);
	}
	.effect b {
		color: var(--ink);
	}
	.buttons {
		display: flex;
		gap: var(--space-8);
		flex-wrap: wrap;
	}
</style>
