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

export const USERNAME_RULE = 'Use 3–24 lowercase letters, numbers or underscores.';
export const PASSWORD_RULE = 'Use at least 10 characters.';

export const labelOf = <T extends readonly { value: string; label: string }[]>(list: T, value: string) =>
	list.find((o) => o.value === value)?.label ?? value;

export const avatarOf = (value: string) => AVATAR_COLORS.find((c) => c.value === value) ?? AVATAR_COLORS[0];

export function initials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase() || '?';
}
