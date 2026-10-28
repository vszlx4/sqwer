<script lang="ts">
	import { enhance } from '$app/forms';
	import RecoveryCodes from '#lib/account/RecoveryCodes.svelte';
	import SettingsSection from '#lib/account/SettingsSection.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import ConfirmForm from '#lib/ui/ConfirmForm.svelte';
	import Field from '#lib/ui/Field.svelte';
	import RequiredNote from '#lib/ui/RequiredNote.svelte';
	import { PASSWORD_RULE } from '#lib/profile.ts';
	import type { PageProps } from './$types';
	import { formatDateTime } from '#lib/i18n/format.ts';

	let { data, form }: PageProps = $props();
	let newPassword = $state('');

	const errorsFor = (action: string) =>
		(form && form.action === action && 'errors' in form ? form.errors : {}) as Record<string, string | undefined>;
	const successFor = (action: string) => (form && form.action === action && 'success' in form ? form.success : null);
	const fmt = (iso: string) =>
		formatDateTime(iso, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
</script>

<Seo title="Security" description="Manage your sqwer password, recovery codes and signed-in devices." noindex />

<div class="page">
	<header class="page-head">
		<h1>Security</h1>
		<p>Your password, the recovery codes that can reset it, and where your account is signed in.</p>
	</header>
	{#if data.reset}<p class="form-alert success" role="status">Your password has been reset and all other devices have been signed out.</p>{/if}

	<SettingsSection title="Password" description="Use at least 10 characters. A short phrase of unrelated words is both strong and easy to remember. Changing it keeps you signed in here.">
		<form method="POST" action="?/password" class="form" use:enhance novalidate>
			{#if errorsFor('password').form}<p class="form-alert" role="alert">{errorsFor('password').form}</p>{/if}
			{#if successFor('password')}<p class="form-alert success" role="status">{successFor('password')}</p>{/if}
			<RequiredNote />
			<Field label="Current password" name="currentPassword" type="password" autocomplete="current-password" required error={errorsFor('password').currentPassword} />
			<Field label="New password" name="newPassword" type="password" autocomplete="new-password" required hint={PASSWORD_RULE} error={errorsFor('password').newPassword} strength bind:value={newPassword} />
			<Field label="Confirm new password" name="confirmPassword" type="password" autocomplete="new-password" required matches={newPassword} error={errorsFor('password').confirmPassword} />
			<button class="btn btn-primary" type="submit">Change password</button>
		</form>
	</SettingsSection>

	<SettingsSection title="Recovery codes" description="sqwer does not send email, so these codes are the only way to reset a forgotten password. Each works once.">
		<div class="codes-state">
			<span class="meter" aria-hidden="true">{#each Array.from({ length: 8 }) as _, i (i)}<span class:on={i < data.recoveryCodes}></span>{/each}</span>
			<p class="text"><strong>{data.recoveryCodes} of 8</strong> unused codes. Generating a new set replaces all existing codes.</p>
		</div>
		{#if form?.action === 'codes' && 'codes' in form && form.codes}
			<RecoveryCodes codes={form.codes} email={form.email} />
		{:else}
			<form method="POST" action="?/codes" class="form" use:enhance novalidate>
				{#if errorsFor('codes').form}<p class="form-alert" role="alert">{errorsFor('codes').form}</p>{/if}
				<RequiredNote />
				<Field label="Confirm with your password" name="password" type="password" autocomplete="current-password" required error={errorsFor('codes').password} />
				<button class="btn" type="submit">Generate new recovery codes</button>
			</form>
		{/if}
	</SettingsSection>

	<SettingsSection title="Signed-in devices" description="Every browser where your account is signed in. Sign out any you do not recognize or no longer use.">
		{#if successFor('revoke')}<p class="form-alert success" role="status">{successFor('revoke')}</p>{/if}
		<ul class="list">
			{#each data.sessions as s (s.id)}
				<li>
					<span class="list-icon" aria-hidden="true"><Icon name="system" size={17} /></span>
					<div class="list-text">
						<p class="device">{s.device}{#if s.current}<span class="tag">This device</span>{/if}</p>
						<p class="when">Signed in {fmt(s.createdAt)} · Last active {fmt(s.lastSeenAt)}</p>
					</div>
					{#if !s.current}
						<ConfirmForm
							action="?/revoke"
							title="Sign out this device?"
							triggerLabel={`Sign out ${s.device}`}
							confirmLabel="Sign out device"
							pendingLabel="Signing out…"
						>
							{#snippet trigger()}Sign out{/snippet}
							{#snippet message()}
								<p><strong>{s.device}</strong> will need to sign in again to use your account.</p>
							{/snippet}
							{#snippet fields()}<input type="hidden" name="id" value={s.id} />{/snippet}
						</ConfirmForm>
					{/if}
				</li>
			{/each}
		</ul>
		{#if data.sessions.length > 1}
			<ConfirmForm
				action="?/revokeOthers"
				title="Sign out all other devices?"
				confirmLabel="Sign out other devices"
				pendingLabel="Signing out…"
			>
				{#snippet trigger()}Sign out all other devices{/snippet}
				{#snippet message()}
					<p>Every device except this one will need to sign in again. Use this if you signed in on a shared or lost device.</p>
				{/snippet}
			</ConfirmForm>
		{/if}
	</SettingsSection>

	<SettingsSection title="Recent activity" description="Sign-ins, password changes and other events on your account. If you do not recognize one, change your password and sign out all other devices.">
		{#if data.events.length}
			<ol class="timeline">
				{#each data.events as e, i (i)}
					<li>
						<p class="device">{e.label}</p>
						<p class="when">{fmt(e.at)} · {e.device}</p>
					</li>
				{/each}
			</ol>
		{:else}
			<p class="text">No security activity has been recorded yet.</p>
		{/if}
	</SettingsSection>
</div>

<style>
	.page-head {
		margin-bottom: 8px;
	}
	.page-head p {
		margin-top: 6px;
		max-width: 64ch;
		color: var(--ink-2);
	}
	h1 {
		font-size: clamp(28px, 3.2vw, 36px);
	}
	.form {
		max-width: 440px;
	}
	.form .btn {
		align-self: flex-start;
	}
	.text {
		font-size: 14.5px;
		line-height: 1.55;
		color: var(--ink-2);
	}
	.text strong {
		color: var(--ink);
	}
	.codes-state {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.meter {
		display: grid;
		grid-template-columns: repeat(8, 1fr);
		gap: 4px;
		max-width: 320px;
	}
	.meter span {
		height: 8px;
		border-radius: 3px;
		background: var(--surface-2);
	}
	.meter .on {
		background: var(--green);
	}
	.list {
		margin: 0;
		padding: 0;
		list-style: none;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	.list li {
		display: grid;
		grid-template-columns: 36px minmax(0, 1fr) auto;
		align-items: center;
		gap: 14px;
		padding: 12px 16px;
	}
	.list li + li {
		border-top: 1px solid var(--line);
	}
	.list-icon {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--bg);
		color: var(--ink-2);
	}
	.device {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
		font-weight: 600;
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
	.timeline {
		margin: 0;
		padding: 0 0 0 18px;
		list-style: none;
		border-left: 2px solid var(--line);
	}
	.timeline li {
		position: relative;
		padding: 0 0 16px 4px;
	}
	.timeline li:last-child {
		padding-bottom: 0;
	}
	.timeline li::before {
		content: '';
		position: absolute;
		left: -25px;
		top: 6px;
		width: 10px;
		height: 10px;
		border-radius: 3px;
		border: 2px solid var(--bg);
		background: var(--ink);
	}
</style>
