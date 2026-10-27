<script lang="ts">
	import { qwertyAnsi, type Finger } from '@sqwer/layouts';
	import Keyboard from '#lib/keyboard/Keyboard.svelte';
	import type { ZoneInfo } from '#lib/keyboard/types.ts';

	// Sample finger map: mostly standard, a few habits, some keys unmapped.
	const layout = qwertyAnsi('mac');
	const HABITS: Record<string, Finger> = { KeyC: 'li', KeyB: 'ri', KeyY: 'li', Comma: 'ri' };
	const PENDING = new Set(['KeyQ', 'KeyZ', 'Quote', 'Slash', 'Backquote', 'Minus', 'Equal', 'BracketLeft', 'BracketRight', 'Backslash', 'Digit0', 'Digit9']);

	const zoneMap = new Map<string, ZoneInfo>();
	layout.keys.forEach((k, i) => {
		if (!k.char || PENDING.has(k.code)) return;
		zoneMap.set(k.code, { finger: HABITS[k.code] ?? k.finger, strength: 0.55 + ((i * 37) % 45) / 100 });
	});
	zoneMap.set('ShiftLeft', { finger: 'lp', strength: 0.9 });
	const pendingKeys = new Set([...PENDING]);
	const selectedKey = 'KeyC';
</script>

<figure class="preview">
	<Keyboard {layout} {zoneMap} {pendingKeys} {selectedKey} label="Example finger map" />
	<figcaption>
		<span class="callout"><span class="mini">C</span> typed with the <b>left index finger</b> rather than the standard middle finger</span>
		<span class="note">Illustrative example</span>
	</figcaption>
</figure>

<style>
	.preview {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	figcaption {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
		font-size: 14px;
		color: var(--ink-2);
	}
	.callout {
		line-height: 1.8;
	}
	.callout .mini {
		margin-right: 6px;
	}
	.mini {
		display: inline-grid;
		place-items: center;
		min-width: 26px;
		height: 26px;
		border-radius: 3px;
		border: 1px solid var(--key-edge);
		border-bottom-width: 3px;
		background: var(--key);
		font-family: var(--font-mono);
		font-size: 13px;
		font-weight: 600;
		color: var(--ink);
	}
	.note {
		color: var(--ink-3);
	}
</style>
