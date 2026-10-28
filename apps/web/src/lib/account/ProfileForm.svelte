<script lang="ts" module>
	export interface ProfileValues {
		displayName: string;
		username: string;
		bio: string;
		experience: string;
		goal: string;
		targetWpm: number | string;
		platform: string;
		avatarColor: string;
		isPublic: boolean;
		headline: string;
		pronouns: string;
		banner: string;
		showRank: boolean;
		showStats: boolean;
		showStreak: boolean;
		showOnLeaderboard: boolean;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import Field from '#lib/ui/Field.svelte';
	import RequiredNote from '#lib/ui/RequiredNote.svelte';
	import {
		AVATAR_COLORS,
		EXPERIENCE,
		GOALS,
		labelOf,
		BANNERS,
		PLATFORMS,
		USERNAME_RULE
	} from '#lib/profile.ts';
	import { courses } from '#lib/courses/store.svelte.ts';
	import ProfileCard from './ProfileCard.svelte';


	interface Props {
		mode: 'setup' | 'edit';
		initial: ProfileValues;
		errors?: Record<string, string | undefined>;
		submitLabel: string;
		/** Form action, for pages with several actions. */
		action?: string;
		/** Current profile picture, shown in the preview. */
		avatar?: string | null;
	}

	let { mode, initial, errors = {}, submitLabel, action, avatar = null }: Props = $props();

	// Editable copy of the initial values; reset when the server sends new ones.
	let v = $state<ProfileValues>(untrack(() => ({ ...initial })));
	let lastInitial = untrack(() => JSON.stringify(initial));
	$effect(() => {
		const next = JSON.stringify(initial);
		if (next === lastInitial) return;
		lastInitial = next;
		v = { ...initial };
	});

	const STEPS = ['About you', 'Experience', 'Keyboard', 'Look'] as const;
	let step = $state(0);
	let submitting = $state(false);
	let usernameStatus = $state<{ ok: boolean; message: string } | null>(null);
	let checkTimer: ReturnType<typeof setTimeout> | undefined;

	// Jump to the first step with a server error.
	$effect(() => {
		const keys = Object.keys(errors);
		if (!keys.length || mode !== 'setup') return;
		const stepOf: Record<string, number> = { displayName: 0, username: 0, headline: 0, pronouns: 0, bio: 0, experience: 1, goal: 1, targetWpm: 1, platform: 2, avatarColor: 3, banner: 3, isPublic: 3 };
		step = Math.min(...keys.map((k) => stepOf[k] ?? 0));
	});

	function checkUsername() {
		clearTimeout(checkTimer);
		const value = String(v.username).trim().toLowerCase();
		if (!value || value === initial.username) {
			usernameStatus = null;
			return;
		}
		checkTimer = setTimeout(async () => {
			try {
				const res = await fetch(`/api/username?u=${encodeURIComponent(value)}`);
				const body = (await res.json()) as { available: boolean; message?: string };
				usernameStatus = body.available
					? { ok: true, message: 'This username is available.' }
					: { ok: false, message: body.message ?? 'This username is not available.' };
			} catch {
				usernameStatus = null;
			}
		}, 350);
	}

	const showStep = (i: number) => mode === 'edit' || step === i;
</script>

<div class="builder" class:setup={mode === 'setup'}>
	<form
		method="POST"
		{action}
		class="form"
		novalidate
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update({ reset: false });
				submitting = false;
			};
		}}
	>
		{#if mode === 'setup'}
			<ol class="stepper" aria-label="Profile setup progress">
				{#each STEPS as label, i (label)}
					<li class:done={i < step} class:current={i === step} aria-current={i === step ? 'step' : undefined}>
						<span class="num">{i + 1}</span>
						<span class="label">{label}</span>
					</li>
				{/each}
			</ol>
		{/if}

		{#if errors.form}<p class="form-alert" role="alert">{errors.form}</p>{/if}
		<RequiredNote />

		<fieldset hidden={!showStep(0)}>
			<legend>About you</legend>
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
			<Field label="Headline" name="headline" maxlength={80} bind:value={v.headline} error={errors.headline} hint="One line under your name, for example: Learning to touch type for work." />
			<Field label="Pronouns" name="pronouns" maxlength={24} bind:value={v.pronouns} error={errors.pronouns} hint="Optional, for example: she/her, he/him or they/them." autocomplete="off" />
			<Field label="Short bio" name="bio" multiline maxlength={280} rows={3} bind:value={v.bio} error={errors.bio} hint={`${String(v.bio ?? '').length}/280 characters`} />
		</fieldset>

		<fieldset hidden={!showStep(1)}>
			<legend>Typing experience<span class="req" aria-hidden="true"></span></legend>
			<div class="options" role="radiogroup" aria-label="Typing experience" aria-required="true">
				{#each EXPERIENCE as o (o.value)}
					<label class="option" class:selected={v.experience === o.value}>
						<input type="radio" name="experience" value={o.value} bind:group={v.experience} />
						<span class="option-title">{o.label}</span>
						<span class="option-hint">{o.hint}</span>
					</label>
				{/each}
			</div>
			{#if errors.experience}<p class="error">{errors.experience}</p>{/if}

			<p class="group-label" id="goal-label">Main goal<span class="req" aria-hidden="true"></span></p>
			<div class="options" role="radiogroup" aria-labelledby="goal-label" aria-required="true">
				{#each GOALS as o (o.value)}
					<label class="option" class:selected={v.goal === o.value}>
						<input type="radio" name="goal" value={o.value} bind:group={v.goal} />
						<span class="option-title">{o.label}</span>
						<span class="option-hint">{o.hint}</span>
					</label>
				{/each}
			</div>
			{#if errors.goal}<p class="error">{errors.goal}</p>{/if}

			<Field label="Target speed (words per minute)" name="targetWpm" type="number" inputmode="numeric" min={10} max={250} required bind:value={v.targetWpm} error={errors.targetWpm} />
		</fieldset>

		<fieldset hidden={!showStep(2)}>
			<legend>Keyboard<span class="req" aria-hidden="true"></span></legend>
			<div class="options two" role="radiogroup" aria-label="Keyboard type" aria-required="true">
				{#each PLATFORMS as o (o.value)}
					<label class="option" class:selected={v.platform === o.value}>
						<input type="radio" name="platform" value={o.value} bind:group={v.platform} />
						<span class="option-title">{o.label}</span>
					</label>
				{/each}
			</div>
			{#if errors.platform}<p class="error">{errors.platform}</p>{/if}
			<p class="note">This sets the keyboard shown in the typing test and finger map.</p>
		</fieldset>

		<fieldset hidden={!showStep(3)}>
			<legend>Look and visibility</legend>
			<p class="group-label" id="banner-label">Banner<span class="req" aria-hidden="true"></span></p>
			<div class="banners" role="radiogroup" aria-labelledby="banner-label" aria-required="true">
				{#each BANNERS as b (b.value)}
					<label class="banner-option" class:selected={v.banner === b.value}>
						<input type="radio" name="banner" value={b.value} bind:group={v.banner} aria-label={b.label} />
						<span class="banner-swatch" style:background={b.css}></span>
						<span class="banner-name">{b.label}</span>
					</label>
				{/each}
			</div>
			{#if errors.banner}<p class="error">{errors.banner}</p>{/if}
			<p class="group-label" id="color-label">Avatar color<span class="req" aria-hidden="true"></span></p>
			<p class="note">Used when you do not have a profile picture.{#if mode === 'setup'}{' '}You can upload a picture later in your profile settings.{/if}</p>
			<div class="swatches" role="radiogroup" aria-labelledby="color-label" aria-required="true">
				{#each AVATAR_COLORS as c (c.value)}
					<label class="swatch" class:selected={v.avatarColor === c.value} title={c.label}>
						<input type="radio" name="avatarColor" value={c.value} bind:group={v.avatarColor} aria-label={c.label} />
						<span style:background={c.css}></span>
					</label>
				{/each}
			</div>
			<p class="group-label">Showcase</p>
			<p class="note">Choose what your profile shows besides your name and details.</p>
			<div class="toggles">
				<label class="check"><input type="checkbox" name="showRank" bind:checked={v.showRank} /><span>Rank and points</span></label>
				<label class="check"><input type="checkbox" name="showStats" bind:checked={v.showStats} /><span>Best speed, accuracy and lessons completed</span></label>
				<label class="check"><input type="checkbox" name="showStreak" bind:checked={v.showStreak} /><span>Daily streak</span></label>
			</div>
			<label class="check public">
				<input type="checkbox" name="showOnLeaderboard" bind:checked={v.showOnLeaderboard} />
				<span>
					Appear on the leaderboards. Your display name, profile picture, level and best competitive speed are shown on the
					<a href="/competitive" target="_blank">Competitive</a> page; your name links to your profile only if it is public.
				</span>
			</label>
			<label class="check public">
				<input type="checkbox" name="isPublic" bind:checked={v.isPublic} />
				<span>
					Make my profile public. Your picture, name, username, headline, pronouns, bio, experience, goal, the showcase
					you chose and your finger map coverage will be visible at <strong>/u/{v.username || 'username'}</strong>. Your
					email address is never shown.
				</span>
			</label>
		</fieldset>

		<div class="buttons">
			{#if mode === 'setup'}
				<button type="button" class="btn" onclick={() => (step = Math.max(0, step - 1))} disabled={step === 0}>Back</button>
				{#if step < STEPS.length - 1}
					<button type="button" class="btn btn-primary" onclick={() => (step += 1)}>Continue</button>
				{:else}
					<button type="submit" class="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : submitLabel}</button>
				{/if}
			{:else}
				<button type="submit" class="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : submitLabel}</button>
			{/if}
		</div>
	</form>

	<aside class="preview" aria-label="Profile preview">
		<p class="preview-label">Preview</p>
		<ProfileCard
			name={v.displayName || 'Your name'}
			username={v.username || 'username'}
			headline={v.headline}
			pronouns={v.pronouns}
			bio={v.bio}
			avatarColor={v.avatarColor}
			{avatar}
			banner={v.banner}
			rank={v.showRank ? courses.rank.rank : null}
			size="compact"
			level={3}
			stats={[
				...(v.showStats ? [{ label: 'Target', value: `${v.targetWpm || '?'} WPM`, tone: 'blue' as const }] : []),
				...(v.showStreak ? [{ label: 'Streak', value: `${courses.streak} ${courses.streak === 1 ? 'day' : 'days'}`, tone: 'orange' as const }] : [])
			]}
		>
			<dl class="facts">
				<div><dt>Experience</dt><dd>{v.experience ? labelOf(EXPERIENCE, v.experience) : 'Not set'}</dd></div>
				<div><dt>Goal</dt><dd>{v.goal ? labelOf(GOALS, v.goal) : 'Not set'}</dd></div>
				<div><dt>Keyboard</dt><dd>{v.platform ? labelOf(PLATFORMS, v.platform) : 'Not set'}</dd></div>
			</dl>
			<p class="visibility" class:on={v.isPublic}>{v.isPublic ? 'Public profile' : 'Private profile'}</p>
		</ProfileCard>
	</aside>
</div>

<style>
	.builder {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 300px;
		gap: 32px;
		align-items: start;
	}
	fieldset {
		display: flex;
		flex-direction: column;
		gap: 18px;
		border: 0;
		padding: 0;
		margin: 0;
	}
	fieldset[hidden] {
		display: none;
	}
	legend {
		font-family: var(--font-serif);
		font-size: 22px;
		margin-bottom: 14px;
		color: var(--ink);
	}
	/* When editing, each part of the form is its own panel, and the save button stays in reach. */
	.builder:not(.setup) fieldset {
		padding: 20px 22px 24px;
		margin-bottom: 14px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	.builder:not(.setup) legend {
		float: left;
		width: 100%;
		margin-bottom: 4px;
		font-size: 19px;
	}
	.stepper {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 8px;
	}
	.stepper li {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px;
		border-radius: 3px;
		border: 1px solid var(--line);
		font-size: 13.5px;
		color: var(--ink-2);
	}
	.stepper li.current {
		border-color: var(--ink);
		color: var(--ink);
		font-weight: 600;
	}
	.stepper li.done {
		background: var(--surface);
		color: var(--ink);
	}
	.num {
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		border-radius: 3px;
		background: var(--surface-2);
		font-weight: 600;
		flex-shrink: 0;
	}
	.current .num,
	.done .num {
		background: var(--accent);
		color: var(--on-accent);
	}
	.group-label {
		font-size: 14.5px;
		font-weight: 600;
		color: var(--ink);
	}
	.options {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px;
	}
	.option {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 14px 14px 14px 42px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--bg);
		cursor: pointer;
	}
	.option input {
		position: absolute;
		left: 14px;
		top: 16px;
		width: 18px;
		height: 18px;
		accent-color: var(--ink);
	}
	.option.selected {
		border-color: var(--ink);
		box-shadow: inset 0 0 0 1px var(--ink);
	}
	.option-title {
		font-weight: 600;
		color: var(--ink);
	}
	.option-hint {
		font-size: 13.5px;
		line-height: 1.45;
		color: var(--ink-2);
	}
	.swatches {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}
	.swatch {
		position: relative;
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		cursor: pointer;
	}
	.swatch input {
		position: absolute;
		opacity: 0;
		inset: 0;
		cursor: pointer;
	}
	.swatch span {
		width: 30px;
		height: 30px;
		border-radius: 3px;
	}
	.swatch.selected {
		border-color: var(--ink);
		box-shadow: inset 0 0 0 1px var(--ink);
	}
	.swatch:has(input:focus-visible) {
		outline: 2px solid var(--ink);
		outline-offset: 2px;
	}
	.note {
		font-size: 13.5px;
		color: var(--ink-2);
	}
	.error {
		font-size: 13.5px;
		font-weight: 600;
		color: var(--error);
	}
	.buttons {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		padding-top: 6px;
	}
	.builder:not(.setup) .buttons {
		position: sticky;
		bottom: 0;
		z-index: 5;
		justify-content: flex-start;
		margin-top: 0;
		padding: 12px 0 16px;
		border-top: 1px solid var(--line);
		background: var(--bg);
	}
	.preview {
		position: sticky;
		top: 96px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.preview-label {
		font-size: 12.5px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-2);
	}
	.facts {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
		margin-top: 10px;
	}
	.facts dt {
		font-size: 12px;
		color: var(--ink-2);
	}
	.facts dd {
		font-size: 14px;
		font-weight: 600;
		color: var(--ink);
	}
	.visibility {
		margin-top: 8px;
		align-self: flex-start;
		padding: 2px 8px;
		border-radius: 3px;
		background: var(--surface-2);
		font-size: 12.5px;
		font-weight: 600;
		color: var(--ink-2);
	}
	.visibility.on {
		background: var(--green-soft);
		color: var(--green);
	}
	.banners {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 8px;
	}
	.banner-option {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 6px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		cursor: pointer;
	}
	.banner-option input {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
	}
	.banner-swatch {
		height: 34px;
		border-radius: 3px;
	}
	.banner-name {
		font-size: 12.5px;
		font-weight: 600;
		color: var(--ink-2);
	}
	.banner-option.selected {
		border-color: var(--ink);
		box-shadow: inset 0 0 0 1px var(--ink);
	}
	.banner-option.selected .banner-name {
		color: var(--ink);
	}
	.banner-option:has(input:focus-visible) {
		outline: 2px solid var(--ink);
		outline-offset: 2px;
	}
	.toggles {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.check.public {
		margin-top: 6px;
		padding: 14px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	@media (max-width: 860px) {
		.builder {
			grid-template-columns: 1fr;
		}
		.preview {
			position: static;
			order: -1;
		}
		.stepper {
			grid-template-columns: repeat(4, auto);
		}
		.stepper .label {
			display: none;
		}
	}
	@media (max-width: 520px) {
		.options {
			grid-template-columns: 1fr;
		}
		.banners {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
