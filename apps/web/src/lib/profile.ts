// Profile options shared by the profile builder (client) and validation (server).

export const EXPERIENCE = [
	{ value: 'beginner', label: 'Beginner', hint: 'I am learning to type without looking at the keyboard.' },
	{ value: 'intermediate', label: 'Intermediate', hint: 'I type regularly but my technique is inconsistent.' },
	{ value: 'proficient', label: 'Proficient', hint: 'I touch type comfortably at a steady pace.' },
	{ value: 'advanced', label: 'Advanced', hint: 'I type fast and want to refine the details.' }
] as const;

export const GOALS = [
	{ value: 'speed', label: 'Speed', hint: 'Increase words per minute.' },
	{ value: 'accuracy', label: 'Accuracy', hint: 'Make fewer errors and corrections.' },
	{ value: 'endurance', label: 'Endurance', hint: 'Type for longer with less strain.' },
	{ value: 'technique', label: 'Technique', hint: 'Use the correct finger for every key.' }
] as const;

export const PLATFORMS = [
	{ value: 'mac', label: 'Mac keyboard' },
	{ value: 'pc', label: 'PC keyboard' }
] as const;

/** Avatar colours: the accent and the finger palette. */
export const AVATAR_COLORS = [
	{ value: 'lime', label: 'Lime', css: 'var(--accent)', ink: 'var(--on-accent)' },
	{ value: 'violet', label: 'Violet', css: 'var(--f-pinky)', ink: '#ffffff' },
	{ value: 'green', label: 'Green', css: 'var(--f-ring)', ink: '#ffffff' },
	{ value: 'orange', label: 'Orange', css: 'var(--f-middle)', ink: '#ffffff' },
	{ value: 'blue', label: 'Blue', css: 'var(--f-index)', ink: '#ffffff' },
	{ value: 'ink', label: 'Graphite', css: 'var(--ink)', ink: 'var(--bg)' }
] as const;

/** Banner styles for the profile card: a gradient with a pattern, built from the site's colours. */
export const BANNERS = [
	{ value: 'lime', label: 'Lime', css: 'linear-gradient(120deg, #ccf900 0%, #8fd14f 100%)' },
	{ value: 'ocean', label: 'Ocean', css: 'linear-gradient(120deg, #2160bd 0%, #4fb3d9 100%)' },
	{ value: 'forest', label: 'Forest', css: 'linear-gradient(120deg, #0d7550 0%, #6cc58f 100%)' },
	{ value: 'sunset', label: 'Sunset', css: 'linear-gradient(120deg, #e05a24 0%, #f2bb3b 100%)' },
	{ value: 'violet', label: 'Violet', css: 'linear-gradient(120deg, #5a46d0 0%, #b07ae8 100%)' },
	{ value: 'rose', label: 'Rose', css: 'linear-gradient(120deg, #b3306a 0%, #f08aa8 100%)' },
	{ value: 'graphite', label: 'Graphite', css: 'linear-gradient(120deg, #141414 0%, #4a4a46 100%)' },
	{ value: 'keys', label: 'Keys', css: 'repeating-linear-gradient(90deg, #f4f2e8 0 34px, #dedac9 34px 36px), linear-gradient(#f4f2e8, #ebe8db)' }
] as const;

export const bannerOf = (value: string) => BANNERS.find((b) => b.value === value) ?? BANNERS[0];

export const USERNAME_RULE = 'Use 3–24 lowercase letters, numbers or underscores.';
export const PASSWORD_RULE = 'Use at least 10 characters.';

export const labelOf = <T extends readonly { value: string; label: string }[]>(list: T, value: string) =>
	list.find((o) => o.value === value)?.label ?? value;

export const avatarOf = (value: string) => AVATAR_COLORS.find((c) => c.value === value) ?? AVATAR_COLORS[0];

export function initials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase() || '?';
}
