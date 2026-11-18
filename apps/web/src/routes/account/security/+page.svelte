<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHead from '#lib/account/PageHead.svelte';
	import RecoveryCodes from '#lib/account/RecoveryCodes.svelte';
	import SettingRow from '#lib/account/SettingRow.svelte';
	import SettingsSection from '#lib/account/SettingsSection.svelte';
	import { formatDateTime } from '#lib/i18n/format.ts';
	import { PASSWORD_RULE } from '#lib/profile.ts';
	import { CONTACT_EMAIL } from '#lib/site/links.ts';
	import Seo from '#lib/site/Seo.svelte';
	import ConfirmForm from '#lib/ui/ConfirmForm.svelte';
	import Field from '#lib/ui/Field.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import type { PageProps } from './$types';

	/** Sign-in details, recovery codes, signed-in devices and recent activity. */
	let { data, form }: PageProps = $props();
	let newPassword = $state('');
	let changing = $state(false);
	let generating = $state(false);

	const errorsFor = (action: string) =>
		(form && form.action === action && 'errors' in form ? form.errors : {}) as Record<string, string | undefined>;
	const successFor = (action: string) => (form && form.action === action && 'success' in form ? form.success : null);
	const fmt = (iso: string) => formatDateTime(iso, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
	const low = $derived(data.recoveryCodes <= 2);
	const newCodes = $derived(form?.action === 'codes' && 'codes' in form && form.codes ? form.codes : null);
	// Reopen a form the server sent back with errors.
	$effect(() => {
		if (Object.keys(errorsFor('password')).length) changing = true;
		if (Object.keys(errorsFor('codes')).length) generating = true;
	});
</script>

<Seo title="Security" description="Manage your sqwer password, recovery codes and signed-in devices." noindex />

<PageHead title="Security" line="How you sign in, how you get back in, and where you are signed in." />

{#if data.reset}<p class="form-alert success top" role="status">Your password has been reset and all other devices have been signed out.</p>{/if}

<div class="panels">
	<SettingsSection title="Sign-in" flush>
		<SettingRow label="Email address" hint={`Private. To change it, write to ${CONTACT_EMAIL} from this address.`} wide>
			<span class="value">{data.account.email}</span>
		</SettingRow>
		<SettingRow label="Password" hint={successFor('password') ?? 'Changing it signs out your other devices.'}>
			{#if !changing}<button class="btn" type="button" onclick={() => (changing = true)}>Change password</button>{/if}
		</SettingRow>
		{#if changing}
			<form method="POST" action="?/password" class="form inset" use:enhance={() => async ({ result, update }) => {
				await update();
				if (result.type === 'success') {
					changing = false;
					newPassword = '';
				}
			}} novalidate>
				{#if errorsFor('password').form}<p class="form-alert" role="alert">{errorsFor('password').form}</p>{/if}
				<Field label="Current password" name="currentPassword" type="password" autocomplete="current-password" required error={errorsFor('password').currentPassword} />
				<Field label="New password" name="newPassword" type="password" autocomplete="new-password" required hint={PASSWORD_RULE} error={errorsFor('password').newPassword} strength bind:value={newPassword} />
				<Field label="Confirm new password" name="confirmPassword" type="password" autocomplete="new-password" required matches={newPassword} error={errorsFor('password').confirmPassword} />
				<div class="buttons">
					<button class="btn btn-primary" type="submit">Change password</button>
					<button class="btn" type="button" onclick={() => (changing = false)}>Cancel</button>
				</div>
			</form>
		{/if}
	</SettingsSection>

	<SettingsSection title="Recovery codes" description="The only way back in if you forget your password. Each works once.">
		{#snippet action()}
			<span class="count" class:low>{data.recoveryCodes} of 8 left</span>
		{/snippet}
		<span class="meter" aria-hidden="true">{#each Array.from({ length: 8 }) as _, i (i)}<span class:on={i < data.recoveryCodes} class:low></span>{/each}</span>
		{#if low && !newCodes}<p class="warn" role="status"><Icon name="info" size={16} /> Few codes left. Make a new set and keep it somewhere safe.</p>{/if}
		{#if newCodes}
			<RecoveryCodes codes={newCodes} email={form && 'email' in form ? (form.email ?? '') : ''} />
		{:else if generating}
			<form method="POST" action="?/codes" class="form" use:enhance novalidate>
				{#if errorsFor('codes').form}<p class="form-alert" role="alert">{errorsFor('codes').form}</p>{/if}
				<Field label="Confirm with your password" name="password" type="password" autocomplete="current-password" required error={errorsFor('codes').password} hint="The new set replaces every code you have now." />
				<div class="buttons">
					<button class="btn btn-primary" type="submit">Make new codes</button>
					<button class="btn" type="button" onclick={() => (generating = false)}>Cancel</button>
				</div>
			</form>
		{:else}
			<button class="btn start" type="button" onclick={() => (generating = true)}>Make a new set</button>
		{/if}
	</SettingsSection>

	<SettingsSection title="Devices" description="Browsers signed in to your account." flush>
		{#snippet action()}
			{#if data.sessions.length > 1}
				<ConfirmForm action="?/revokeOthers" title="Sign out all other devices?" confirmLabel="Sign out other devices" pendingLabel="Signing out…">
					{#snippet trigger()}Sign out all others{/snippet}
					{#snippet message()}
						<p>Every device except this one will need to sign in again.</p>
					{/snippet}
				</ConfirmForm>
			{/if}
		{/snippet}
		{#if successFor('revoke')}<p class="form-alert success inset-alert" role="status">{successFor('revoke')}</p>{/if}
		<ul class="rows">
			{#each data.sessions as s (s.id)}
				<li>
					<span class="glyph" aria-hidden="true"><Icon name="system" size={17} /></span>
					<span class="row-text">
						<b>{s.device}{#if s.current}<span class="tag">This device</span>{/if}</b>
						<span>Last active {fmt(s.lastSeenAt)} · Signed in {fmt(s.createdAt)}</span>
					</span>
					{#if !s.current}
						<ConfirmForm action="?/revoke" title="Sign out this device?" triggerLabel={`Sign out ${s.device}`} confirmLabel="Sign out device" pendingLabel="Signing out…">
							{#snippet trigger()}Sign out{/snippet}
							{#snippet message()}
								<p><strong>{s.device}</strong> will need to sign in again.</p>
							{/snippet}
							{#snippet fields()}<input type="hidden" name="id" value={s.id} />{/snippet}
						</ConfirmForm>
					{/if}
				</li>
			{/each}
		</ul>
	</SettingsSection>

	<SettingsSection title="Activity" description="Don't recognize one? Change your password and sign out the other devices." flush>
		{#if data.events.length}
			<ol class="rows">
				{#each data.events as e, i (i)}
					<li class="event">
						<span class="dot" aria-hidden="true"></span>
						<span class="row-text">
							<b>{e.label}</b>
							<span>{e.device}</span>
						</span>
						<time datetime={e.at}>{fmt(e.at)}</time>
					</li>
				{/each}
			</ol>
		{:else}
			<p class="empty">No activity recorded yet.</p>
		{/if}
	</SettingsSection>
</div>

<style>
	.panels {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
	}
	.top {
		margin-bottom: var(--space-16);
	}
	.value {
		font-weight: var(--fw-semibold);
		overflow-wrap: anywhere;
	}
	.form {
		max-width: var(--w-form);
	}
	.inset {
		padding: 0 var(--space-20) var(--space-20);
	}
	.inset-alert {
		margin: var(--space-16) var(--space-20) 0;
	}
	.buttons {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-8);
	}
	.start {
		align-self: flex-start;
	}
	.count {
		padding: var(--space-2) var(--space-8);
		border-radius: var(--radius);
		background: var(--success-soft);
		color: var(--success);
		font-size: var(--fs-13);
		font-weight: var(--fw-semibold);
		font-variant-numeric: tabular-nums;
	}
	.count.low {
		background: var(--error-soft);
		color: var(--error);
	}
	.meter {
		display: grid;
		grid-template-columns: repeat(8, 1fr);
		gap: var(--space-4);
		max-width: 320px;
	}
	.meter span {
		height: 8px;
		border-radius: var(--radius);
		background: var(--surface-2);
	}
	.meter .on {
		background: var(--strength-strong);
	}
	.meter .on.low {
		background: var(--error);
	}
	.warn {
		display: flex;
		align-items: center;
		gap: var(--space-8);
		font-size: var(--fs-14);
		font-weight: var(--fw-semibold);
		color: var(--error);
	}
	.rows {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.rows li {
		display: grid;
		grid-template-columns: 36px minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--space-16);
		padding: var(--space-12) var(--space-20);
	}
	.rows li + li {
		border-top: 1px solid var(--line);
	}
	.glyph {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink-2);
	}
	.row-text {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		min-width: 0;
	}
	.row-text b {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--space-8);
		font-size: var(--fs-15);
	}
	.row-text > span {
		font-size: var(--fs-14);
		color: var(--ink-2);
	}
	.tag {
		padding: var(--space-2) var(--space-8);
		border-radius: var(--radius);
		background: var(--ink);
		color: var(--bg);
		font-size: var(--fs-12);
		font-weight: var(--fw-semibold);
	}
	.event {
		grid-template-columns: 12px minmax(0, 1fr) auto;
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: var(--radius-pill);
		background: var(--ink-3);
	}
	time {
		font-size: var(--fs-13);
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.empty {
		padding: var(--space-16) var(--space-20);
		font-size: var(--fs-14);
		color: var(--ink-2);
	}
	@media (max-width: 560px) {
		.rows li {
			grid-template-columns: minmax(0, 1fr) auto;
		}
		.glyph {
			display: none;
		}
		.event {
			grid-template-columns: minmax(0, 1fr);
		}
		.dot {
			display: none;
		}
	}
</style>
