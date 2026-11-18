<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import AvatarUpload from '#lib/account/AvatarUpload.svelte';
	import PageHead from '#lib/account/PageHead.svelte';
	import ProfileCard from '#lib/account/ProfileCard.svelte';
	import SaveBar from '#lib/account/SaveBar.svelte';
	import SettingsSection from '#lib/account/SettingsSection.svelte';
	import { courses } from '#lib/courses/store.svelte.ts';
	import { AVATAR_COLORS, BANNERS, USERNAME_RULE } from '#lib/profile.ts';
	import Seo from '#lib/site/Seo.svelte';
	import Field from '#lib/ui/Field.svelte';
	import type { PageProps } from './$types';

	/** Profile: picture, identity and look, with the public card beside it. Course and privacy have their own pages. */
	let { data, form }: PageProps = $props();
	const p = $derived(data.profile!);

	const pick = () => ({
		displayName: p.displayName,
		username: p.username,
		headline: p.headline,
		pronouns: p.pronouns,
		bio: p.bio,
		banner: p.banner,
		avatarColor: p.avatarColor
	});
	type Values = ReturnType<typeof pick>;
	let saved = $state<Values>(untrack(pick));
	let v = $state<Values>(untrack(pick));
	const dirty = $derived(JSON.stringify(v) !== JSON.stringify(saved));
	let saving = $state(false);
	let justSaved = $state(false);
	const errors = $derived((form && 'errors' in form ? form.errors : {}) as Record<string, string | undefined>);

	let usernameStatus = $state<{ ok: boolean; message: string } | null>(null);
	let timer: ReturnType<typeof setTimeout> | undefined;
	function checkUsername() {
		clearTimeout(timer);
		const value = v.username.trim().toLowerCase();
		if (!value || value === saved.username) {
			usernameStatus = null;
			return;
		}
		timer = setTimeout(async () => {
			try {
				const res = await fetch(`/api/username?u=${encodeURIComponent(value)}`);
				const body = (await res.json()) as { available: boolean; message?: string };
				usernameStatus = body.available ? { ok: true, message: 'Available.' } : { ok: false, message: body.message ?? 'Not available.' };
			} catch {
				usernameStatus = null;
			}
		}, 350);
	}
</script>

<Seo title="Profile" description="Edit your sqwer profile." noindex />

<PageHead title="Profile" line="How you appear on your profile and the leaderboards.">
	{#snippet action()}
		{#if p.isPublic}<a class="btn" href={`/u/${p.username}`}>View public profile</a>{/if}
	{/snippet}
</PageHead>

<div class="layout">
	<div class="panels">
		<SettingsSection title="Picture" description="Square, shown on your profile, in the header and on the leaderboards.">
			{#if form && 'avatarSaved' in form}<p class="form-alert success" role="status">Picture saved.</p>{/if}
			{#if form && 'avatarRemoved' in form}<p class="form-alert success" role="status">Picture removed.</p>{/if}
			<AvatarUpload name={v.displayName} color={v.avatarColor} src={data.avatar} error={form && 'avatarError' in form ? (form.avatarError as string) : null} />
		</SettingsSection>

		<form
			method="POST"
			action="?/save"
			class="panels"
			novalidate
			use:enhance={() => {
				saving = true;
				return async ({ result, update }) => {
					await update({ reset: false });
					if (result.type === 'success') {
						saved = { ...v };
						justSaved = true;
						usernameStatus = null;
					}
					saving = false;
				};
			}}
			oninput={() => (justSaved = false)}
		>
			{#if errors.form}<p class="form-alert" role="alert">{errors.form}</p>{/if}
			<SettingsSection title="Identity">
				<div class="pair">
					<Field label="Display name" name="displayName" required maxlength={40} bind:value={v.displayName} error={errors.displayName} autocomplete="nickname" />
					<Field
						label="Username"
						name="username"
						required
						maxlength={24}
						autocapitalize="none"
						spellcheck={false}
						bind:value={v.username}
						oninput={checkUsername}
						hint={usernameStatus?.message ?? USERNAME_RULE}
						error={errors.username ?? (usernameStatus && !usernameStatus.ok ? usernameStatus.message : null)}
					/>
				</div>
				<div class="pair">
					<Field label="Headline" name="headline" maxlength={80} bind:value={v.headline} error={errors.headline} hint="One line under your name." />
					<Field label="Pronouns" name="pronouns" maxlength={24} bind:value={v.pronouns} error={errors.pronouns} hint="Optional." autocomplete="off" />
				</div>
				<Field label="Bio" name="bio" multiline maxlength={280} rows={3} bind:value={v.bio} error={errors.bio} hint={`${v.bio.length}/280`} />
			</SettingsSection>

			<SettingsSection title="Look" description="The color shows when you have no picture.">
				<fieldset>
					<legend>Banner</legend>
					<div class="banners">
						{#each BANNERS as b (b.value)}
							<label class="banner" class:on={v.banner === b.value}>
								<input class="sr-only" type="radio" name="banner" value={b.value} bind:group={v.banner} />
								<span class="banner-swatch" style:background={b.css}></span>
								<span class="banner-name">{b.label}</span>
							</label>
						{/each}
					</div>
					{#if errors.banner}<p class="error">{errors.banner}</p>{/if}
				</fieldset>
				<fieldset>
					<legend>Color</legend>
					<div class="colors">
						{#each AVATAR_COLORS as c (c.value)}
							<label class="color" class:on={v.avatarColor === c.value} title={c.label}>
								<input class="sr-only" type="radio" name="avatarColor" value={c.value} bind:group={v.avatarColor} aria-label={c.label} />
								<span style:background={c.css}></span>
							</label>
						{/each}
					</div>
					{#if errors.avatarColor}<p class="error">{errors.avatarColor}</p>{/if}
				</fieldset>
			</SettingsSection>

			<SaveBar
				{dirty}
				{saving}
				saved={justSaved}
				label="Save profile"
				ondiscard={() => {
					v = { ...saved };
					usernameStatus = null;
				}}
			/>
		</form>
	</div>

	<aside class="preview" aria-label="Profile preview">
		<ProfileCard
			name={v.displayName || 'Your name'}
			username={v.username || 'username'}
			headline={v.headline}
			pronouns={v.pronouns}
			bio={v.bio}
			avatarColor={v.avatarColor}
			avatar={data.avatar}
			banner={v.banner}
			rank={p.showRank && courses.loaded ? courses.rank.rank : null}
			size="compact"
			level={3}
		/>
		<p class="visibility">
			{p.isPublic ? 'Public at' : 'Private.'}
			{#if p.isPublic}<a href={`/u/${p.username}`}>/u/{p.username}</a>{/if}
			<a href="/account/privacy">{p.isPublic ? 'Privacy settings' : 'Make it public'}</a>
		</p>
	</aside>
</div>

<style>
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 300px;
		gap: var(--space-24);
		align-items: start;
	}
	.panels {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
		min-width: 0;
	}
	.pair {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-16);
	}
	fieldset {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		margin: 0;
		padding: 0;
		border: 0;
		min-width: 0;
	}
	legend {
		margin-bottom: var(--space-8);
		font-size: var(--fs-14);
		font-weight: var(--fw-semibold);
	}
	.banners {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: var(--space-8);
	}
	.banner {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		padding: var(--space-6);
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		cursor: pointer;
		transition: border-color var(--dur-fast) var(--ease-out);
	}
	.banner:hover {
		border-color: var(--ink-3);
	}
	.banner-swatch {
		height: 32px;
		border-radius: var(--radius);
	}
	.banner-name {
		font-size: var(--fs-13);
		font-weight: var(--fw-semibold);
		color: var(--ink-2);
	}
	.banner.on,
	.color.on {
		border-color: var(--ink);
		box-shadow: inset 0 0 0 1px var(--ink);
	}
	.banner.on .banner-name {
		color: var(--ink);
	}
	.colors {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-8);
	}
	.color {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		cursor: pointer;
	}
	.color span {
		width: 30px;
		height: 30px;
		border-radius: var(--radius);
	}
	.banner:has(input:focus-visible),
	.color:has(input:focus-visible) {
		outline: 2px solid var(--ink);
		outline-offset: 2px;
	}
	.error {
		font-size: var(--fs-14);
		font-weight: var(--fw-semibold);
		color: var(--error);
	}
	.preview {
		position: sticky;
		top: 96px;
		display: flex;
		flex-direction: column;
		gap: var(--space-10);
	}
	.visibility {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4) var(--space-8);
		font-size: var(--fs-14);
		color: var(--ink-2);
	}
	.visibility a {
		color: var(--ink);
		font-weight: var(--fw-semibold);
	}
	@media (max-width: 1100px) {
		.layout {
			grid-template-columns: minmax(0, 1fr);
		}
		.preview {
			position: static;
			order: -1;
			max-width: var(--w-form);
		}
	}
	@media (max-width: 560px) {
		.pair {
			grid-template-columns: minmax(0, 1fr);
		}
		.banners {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
