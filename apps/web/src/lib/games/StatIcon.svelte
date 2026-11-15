<script lang="ts" module>
	// Solid 24×24 glyphs for run statistics, drawn to sit with the level icons (LevelIcon). Holes use evenodd.
	const GLYPHS = {
		words: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM11 6.5 7 17h2.2l.8-2.3h4l.8 2.3H17L13 6.5Zm1 3.4 1.4 3.9h-2.8Z',
		right: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM17 8.5l-6.4 7-3.5-3.2-1.4 1.5 5 4.6 7.8-8.6Z',
		streak: 'M12 2.5l8.5 8-2.2 2.2L12 6.8l-6.3 5.9-2.2-2.2ZM12 10.5l8.5 8-2.2 2.2-6.3-5.9-6.3 5.9-2.2-2.2Z',
		score: 'M12 2.2l3 6.2 6.8.9-5 4.7 1.3 6.7-6.1-3.3-6.1 3.3 1.3-6.7-5-4.7 6.8-.9Z',
		round: 'M4.5 2h2v20h-2ZM8 3h12l-3 4.5 3 4.5H8Z',
		tries: 'M12 21.3s-9-5.5-9-11.8A5 5 0 0 1 12 6.6a5 5 0 0 1 9 2.9c0 6.3-9 11.8-9 11.8Z',
		set: 'M4 4.6A2.6 2.6 0 0 1 6.6 2H20v15.5H6.6a.75.75 0 0 0 0 1.5H20v3H6.6A2.6 2.6 0 0 1 4 19.4Z',
		time: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM11 6v7.4l4.6 2.8 1-1.7-3.6-2.2V6Z',
		adaptive: 'M12 4A10 10 0 0 0 3.3 19h17.4A10 10 0 0 0 12 4Zm4.9 4.6-3.6 5.9a1.9 1.9 0 1 1-1.6-1.1Z',
		levels: 'M3 15h4v6H3ZM10 10h4v11h-4ZM17 4h4v17h-4Z',
		settings: 'M4 5h9.2a2.8 2.8 0 0 1 5.6 0H20v2h-1.2a2.8 2.8 0 0 1-5.6 0H4Zm0 6h1.2a2.8 2.8 0 0 1 5.6 0H20v2h-9.2a2.8 2.8 0 0 1-5.6 0H4Zm0 6h7.2a2.8 2.8 0 0 1 5.6 0H20v2h-3.2a2.8 2.8 0 0 1-5.6 0H4Z',
		guide: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM11 10.5h2V17h-2ZM12 6.5a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Z',
		plays: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM9.5 7.5v9l7-4.5Z'
	} as const;
	export type StatIconName = keyof typeof GLYPHS;
</script>

<script lang="ts">
	let { name, size = 16 }: { name: StatIconName; size?: number } = $props();
</script>

<svg class="stat-icon" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
	<path d={GLYPHS[name]} fill-rule="evenodd" />
</svg>

<style>
	.stat-icon {
		flex: none;
		display: block;
	}
</style>
