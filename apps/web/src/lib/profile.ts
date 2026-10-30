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

/**
 * Avatar colours: the five palette hues and ink. `value` is stored on profiles, so old keys stay
 * ('green' is cyan, 'blue' is amber since the 2026-10-30 palette).
 */
export const AVATAR_COLORS = [
	{ value: 'lime', label: 'Lime', css: 'var(--lime)', ink: 'var(--on-hue)' },
	{ value: 'green', label: 'Cyan', css: 'var(--cyan)', ink: 'var(--on-hue)' },
	{ value: 'orange', label: 'Orange', css: 'var(--orange)', ink: 'var(--on-hue)' },
	{ value: 'violet', label: 'Violet', css: 'var(--violet)', ink: 'var(--on-hue)' },
	{ value: 'blue', label: 'Amber', css: 'var(--amber)', ink: 'var(--on-hue)' },
	{ value: 'ink', label: 'Graphite', css: 'var(--ink)', ink: 'var(--bg)' }
] as const;

/**
 * Banner styles for the profile card: two palette hues blended, or neutrals. `value` is stored on
 * profiles, so old keys stay and only the label and colours follow the palette.
 */
export const BANNERS = [
	{ value: 'lime', label: 'Lime', css: 'linear-gradient(120deg, var(--lime) 0%, var(--amber) 100%)' },
	{ value: 'ocean', label: 'Lagoon', css: 'linear-gradient(120deg, var(--cyan) 0%, var(--violet) 100%)' },
	{ value: 'forest', label: 'Fresh', css: 'linear-gradient(120deg, var(--lime) 0%, var(--cyan) 100%)' },
	{ value: 'sunset', label: 'Sunset', css: 'linear-gradient(120deg, var(--orange) 0%, var(--amber) 100%)' },
	{ value: 'violet', label: 'Violet', css: 'linear-gradient(120deg, var(--violet) 0%, var(--cyan) 100%)' },
	{ value: 'rose', label: 'Ember', css: 'linear-gradient(120deg, var(--orange) 0%, var(--violet) 100%)' },
	{ value: 'graphite', label: 'Graphite', css: 'linear-gradient(120deg, var(--band-bg) 0%, var(--band-line-strong) 100%)' },
	{ value: 'keys', label: 'Keys', css: 'repeating-linear-gradient(90deg, var(--surface) 0 34px, var(--line) 34px 36px), linear-gradient(var(--surface), var(--surface-2))' }
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
