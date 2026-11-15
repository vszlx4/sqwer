<script lang="ts" module>
	// Solid 24×24 glyphs for the voice screens, drawn to sit with LevelIcon and StatIcon. Holes use evenodd.
	const SPEAKER = 'M2.5 9h4l5-4.5v15l-5-4.5h-4Z';
	const GLYPHS = {
		standard: `${SPEAKER}M14.5 9.5a3.5 3.5 0 0 1 0 5l1.4 1.4a5.5 5.5 0 0 0 0-7.8ZM17.3 6.7a7.5 7.5 0 0 1 0 10.6l1.4 1.4a9.5 9.5 0 0 0 0-13.4Z`,
		enhanced: `${SPEAKER}M18 2.5l1.3 3.4 3.2 1.3-3.2 1.3L18 11.9l-1.3-3.4-3.2-1.3 3.2-1.3ZM18.5 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z`,
		device: 'M12 3a9 9 0 0 0-9 9v7a2 2 0 0 0 2 2h3.5v-8.5H5V12a7 7 0 0 1 14 0v.5h-3.5V21H19a2 2 0 0 0 2-2v-7a9 9 0 0 0-9-9Z',
		clips: 'M2.5 9.5h2.4v5H2.5ZM6.9 6h2.4v12H6.9ZM11.3 2.5h2.4v19h-2.4ZM15.7 6.5h2.4v11h-2.4ZM20.1 9.5h1.4v5h-1.4Z',
		sets: 'M4 4.6A2.6 2.6 0 0 1 6.6 2H20v15.5H6.6a.75.75 0 0 0 0 1.5H20v3H6.6A2.6 2.6 0 0 1 4 19.4Z',
		health: 'M12 2 4 5.2V11c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5.2Zm-1.2 13.8-3.7-3.6 1.4-1.4 2.3 2.2 4.9-5 1.4 1.4Z',
		unclear: 'M4.5 2h2v20h-2ZM8 3h12l-3 4.5 3 4.5H8Z'
	} as const;
	export type VoiceIconName = keyof typeof GLYPHS;
</script>

<script lang="ts">
	/** A voice screen glyph in its color (app.css --voice-<name>). Decorative unless `label` names it. */
	let { name, size = 18, label }: { name: VoiceIconName; size?: number; label?: string } = $props();
</script>

<svg
	class="voice-icon"
	style:color={`var(--voice-${name})`}
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="currentColor"
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : 'true'}
>
	<path d={GLYPHS[name]} fill-rule="evenodd" />
</svg>

<style>
	.voice-icon {
		flex: none;
		display: block;
	}
</style>
