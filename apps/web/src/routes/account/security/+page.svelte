<script lang="ts">
	import { enhance } from '$app/forms';
	import RecoveryCodes from '#lib/account/RecoveryCodes.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import Field from '#lib/ui/Field.svelte';
	import { PASSWORD_RULE } from '#lib/profile.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const errorsFor = (action: string) =>
		(form && form.action === action && 'errors' in form ? form.errors : {}) as Record<string, string | undefined>;
	const successFor = (action: string) => (form && form.action === action && 'success' in form ? form.success : null);
	const fmt = (iso: string) =>
		new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
</script>

<Seo title="Security" description="Manage your sqwer password, recovery codes and signed-in devices." noindex />

<div class="stack">
	<h1>Security</h1>
	{#if data.reset}<p class="form-alert success" role="status">Your password has been reset and all other devices have been signed out.</p>{/if}

	<section class="card" aria-labelledby="pw-title">
		<h2 id="pw-title">Change password</h2>
		<form method="POST" action="?/password" class="form" use:enhance novalidate>
			{#if errorsFor('password').form}<p class="form-alert" role="alert">{errorsFor('password').form}</p>{/if}
			{#if successFor('password')}<p class="form-alert success" role="status">{successFor('password')}</p>{/if}
			<Field label="Current password" name="currentPassword" type="password" autocomplete="current-password" required error={errorsFor('password').currentPassword} />
			<Field label="New password" name="newPassword" type="password" autocomplete="new-password" required hint={PASSWORD_RULE} error={errorsFor('password').newPassword} />
			<Field label="Confirm new password" name="confirmPassword" type="password" autocomplete="new-password" required error={errorsFor('password').confirmPassword} />
			<button class="btn btn-primary" type="submit">Change password</button>
		</form>
	</section>

	<section class="card" aria-labelledby="codes-title">
		<h2 id="codes-title">Recovery codes</h2>
		<p class="text">
			Recovery codes let you reset your password. You have <strong>{data.recoveryCodes} of 8</strong> unused codes.
			Generating a new set replaces all existing codes.
		</p>
		{#if form?.action === 'codes' && 'codes' in form && form.codes}
			<RecoveryCodes codes={form.codes} email={form.email} />
		{:else}
			<form method="POST" action="?/codes" class="form inline" use:enhance novalidate>
				{#if errorsFor('codes').form}<p class="form-alert" role="alert">{errorsFor('codes').form}</p>{/if}
				<Field label="Confirm with your password" name="password" type="password" autocomplete="current-password" required error={errorsFor('codes').password} />
				<button class="btn" type="submit">Generate new recovery codes</button>
			</form>
		{/if}
	</section>

	<section class="card" aria-labelledby="sessions-title">
		<h2 id="sessions-title">Signed-in devices</h2>
		{#if successFor('revoke')}<p class="form-alert success" role="status">{successFor('revoke')}</p>{/if}
		<ul class="sessions">
			{#each data.sessions as s (s.id)}
				<li>
					<div>
						<p class="device">{s.device}{#if s.current}<span class="tag">This device</span>{/if}</p>
						<p class="when">Signed in {fmt(s.createdAt)} · Last active {fmt(s.lastSeenAt)}</p>
					</div>
					{#if !s.current}
						<form method="POST" action="?/revoke" use:enhance>
							<input type="hidden" name="id" value={s.id} />
							<button class="btn" type="submit" aria-label={`Sign out ${s.device}`}>Sign out</button>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
		{#if data.sessions.length > 1}
			<form method="POST" action="?/revokeOthers" use:enhance>
				<button class="btn" type="submit">Sign out all other devices</button>
			</form>
		{/if}
	</section>

	<section class="card" aria-labelledby="activity-title">
		<h2 id="activity-title">Recent security activity</h2>
		{#if data.events.length}
			<ul class="sessions">
				{#each data.events as e, i (i)}
					<li>
						<div>
							<p class="device">{e.label}</p>
							<p class="when">{fmt(e.at)} · {e.device}</p>
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="text">No security activity has been recorded yet.</p>
		{/if}
		<p class="text">If you do not recognise an activity, change your password and sign out all other devices.</p>
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
		gap: 16px;
		padding: 22px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	h2 {
		font-size: 24px;
	}
	.form {
		max-width: 440px;
	}
	.form .btn {
		align-self: flex-start;
	}
	.text {
		font-size: 15px;
		line-height: 1.55;
		color: var(--ink-2);
	}
	.text strong {
		color: var(--ink);
	}
	.sessions {
		display: flex;
		flex-direction: column;
	}
	.sessions li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		padding: 12px 0;
		border-bottom: 1px solid var(--line);
	}
	.device {
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.tag {
		padding: 2px 8px;
		border-radius: 3px;
		background: var(--accent);
		color: var(--on-accent);
		font-size: 12px;
		font-weight: 600;
	}
	.when {
		font-size: 13.5px;
		color: var(--ink-2);
	}
</style>
