<script lang="ts" module>
	import type { TierId } from './levels.ts';

	// Solid 24×24 glyphs for the endless levels. Holes (eyes, veins, inner flame) are cut with evenodd; `extra` is
	// drawn on top with the default fill rule where a part overlaps the body.
	const GLYPHS: Record<TierId, { d: string; extra?: string }> = {
		easy: {
			d: 'M11.1 10h1.8v10.2h-1.8zM11.2 13C11.2 9 8.6 6.6 4 6.6c0 4 2.6 6.4 7.2 6.4ZM12.8 11c0-3.7 2.4-6.2 7-6.2 0 3.7-2.4 6.2-7 6.2ZM7 19.8h10v2H7z'
		},
		medium: { d: 'M4 20C4 10.5 9.5 4.6 20.5 3.5 19.4 14.5 13.5 20 4 20ZM5.6 19.5l8.6-8.6 1 1-8.6 8.6Z' },
		hard: {
			d: 'M12 22c-4.4 0-7.5-3-7.5-7 0-3.5 2.3-5.7 4.1-7.9.4 2.1 1.5 3.4 3 3.7-.5-3.2.6-5.9 3.2-7.8.6 3.7 4.2 6.2 4.2 11.6 0 4.4-2.8 7.4-7 7.4ZM12 20c-1.9 0-3.2-1.3-3.2-3 0-1.6 1-2.6 1.9-3.6.3 1 .8 1.5 1.5 1.6-.2-1.4.3-2.6 1.4-3.5.3 1.6 1.8 2.7 1.8 5.1 0 1.9-1.4 3.4-3.4 3.4Z'
		},
		expert: { d: 'M13.5 1.5 3.8 14h6.9l-1.2 8.5L19.2 10h-6.9l1.2-8.5Z' },
		insane: {
			d: 'M12 22c-4.7 0-7.6-3.2-7.6-7.5S7.3 6.5 12 6.5s7.6 3.7 7.6 8-2.9 7.5-7.6 7.5ZM7.6 12.3l3.8 1.6-.4 1.5c-1.8.2-3.2-1-3.4-3.1ZM16.4 12.3l-3.8 1.6.4 1.5c1.8.2 3.2-1 3.4-3.1ZM8.8 18.6c2-1.5 4.4-1.5 6.4 0l-.7 1c-1.6-1-3.4-1-5 0Z',
			extra: 'M6.4 10.4C3.7 8.8 3 5.6 3.6 2.4 4.9 5 6.7 6.3 9.4 6.6ZM17.6 10.4c2.7-1.6 3.4-4.8 2.8-8-1.3 2.6-3.1 3.9-5.8 4.2Z'
		},
		nightmare: {
			d: 'M12 2a9 9 0 0 0-9 9c0 3.1 1.6 5.6 4 7v3.2c0 .5.4.8.8.8h8.4c.4 0 .8-.3.8-.8V18c2.4-1.4 4-3.9 4-7a9 9 0 0 0-9-9ZM8.5 14.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4ZM15.5 14.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4ZM12 14.8l1.3 2.3h-2.6ZM10.1 19.4h1v2.6h-1ZM12.9 19.4h1v2.6h-1Z'
		}
	};
</script>

<script lang="ts">
	/** A level's solid icon in its color (app.css --level-<id>). */
	let { id, size = 18 }: { id: TierId; size?: number } = $props();
	const glyph = $derived(GLYPHS[id]);
</script>

<svg class="level-icon" style:color={`var(--level-${id})`} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
	<path d={glyph.d} fill-rule="evenodd" />
	{#if glyph.extra}<path d={glyph.extra} />{/if}
</svg>

<style>
	.level-icon {
		flex: none;
		display: block;
	}
</style>
