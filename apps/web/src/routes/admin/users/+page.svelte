<script lang="ts">
	import { enhance } from '$app/forms';
	import Seo from '#lib/site/Seo.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const a = $derived(data.account);
	// Actions keep the search, so the page still shows the account afterwards.
	const action = (name: string) => `?q=${encodeURIComponent(data.q)}&/${name}`;
	const fmt = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
</script>

<Seo title="Users" description="Account moderation for sqwer administrators." noindex />

<header class="head">
	<h1>Users</h1>
	<p>Find an account by its exact email address or username to suspend it or lift a suspension. A suspended account cannot sign in, is signed out everywhere and disappears from leaderboards and public profiles; nothing is deleted.</p>
</header>

<form method="GET" class="search" data-sveltekit-keepfocus>
	<label>
		<span>Email address or username <span class="req" aria-hidden="true"></span></span>
		<input name="q" value={data.q} autocomplete="off" spellcheck="false" required />
	</label>
	<button class="btn" type="submit">Find</button>
</form>

{#if form?.error}<p class="form-alert" role="alert">{form.error}</p>{/if}
{#if form?.done}<p class="form-alert success" role="status">{form.done}</p>{/if}

{#if 'limited' in data && data.limited}
	<p class="form-alert" role="alert">Too many searches. Please try again later.</p>
{:else if data.searched && !a}
	<p class="empty">No account matches “{data.q}”.</p>
{:else if a}
	<section class="account" aria-label="Account">
		<dl>
			<div><dt>Email</dt><dd>{a.email}</dd></div>
			<div><dt>Profile</dt><dd>{a.username ? `${a.displayName} (@${a.username})` : 'Not set up'}</dd></div>
			<div><dt>Member since</dt><dd>{fmt(a.createdAt)}</dd></div>
			<div><dt>Status</dt><dd>{a.suspendedAt ? `Suspended on ${fmt(a.suspendedAt)}: ${a.suspendedReason ?? ''}` : a.admin ? 'Administrator' : 'Active'}</dd></div>
		</dl>
		{#if a.admin}
			<p class="note">Administrators can only be suspended from the server's command line.</p>
		{:else if a.suspendedAt}
			<form method="POST" action={action('unsuspend')} use:enhance>
				<input type="hidden" name="email" value={a.email} />
				<button class="btn" type="submit">Lift the suspension</button>
			</form>
		{:else}
			<form method="POST" action={action('suspend')} class="suspend" use:enhance>
				<input type="hidden" name="email" value={a.email} />
				<label>
					<span>Reason, kept with the account <span class="req" aria-hidden="true"></span></span>
					<input name="reason" minlength="3" maxlength="500" required />
				</label>
				<button class="btn btn-danger" type="submit">Suspend and sign out everywhere</button>
			</form>
		{/if}
	</section>
{/if}

<style>
	.head h1 {
		font-size: clamp(30px, 3.6vw, 42px);
	}
	.head p {
		margin-top: 6px;
		max-width: 70ch;
		color: var(--ink-2);
	}
	.search,
	.suspend {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		gap: 10px;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 13.5px;
		font-weight: 600;
		color: var(--ink-2);
	}
	input {
		min-height: 42px;
		min-width: min(320px, 100%);
		padding: 0 12px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--bg);
		color: var(--ink);
		font: inherit;
		font-weight: 400;
	}
	.account {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 18px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	dl {
		display: grid;
		gap: 8px;
		margin: 0;
	}
	dl div {
		display: grid;
		grid-template-columns: 140px 1fr;
		gap: 10px;
	}
	dt {
		font-size: 13px;
		font-weight: 600;
		color: var(--ink-2);
	}
	dd {
		margin: 0;
		overflow-wrap: anywhere;
	}
	.empty,
	.note {
		color: var(--ink-2);
	}
</style>
