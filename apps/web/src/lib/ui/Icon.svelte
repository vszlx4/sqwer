<script lang="ts" module>
	// Simple 24×24 stroke icons drawn for sqwer.
	const ICONS = {
		restart: 'M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6',
		sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
		moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z',
		system: 'M4 5h16v11H4zM9 20h6M12 16v4',
		at: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm0 0v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1',
		hash: 'M5 9h15M4 15h15M10 3 8 21M16 3l-2 18',
		clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2',
		text: 'M4 6h16M4 12h10M4 18h13',
		keyboard: 'M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10',
		hand: 'M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-6.5a1.5 1.5 0 0 1 3 0V11m0-4.5a1.5 1.5 0 0 1 3 0V13a7 7 0 0 1-7 7h-.5a6 6 0 0 1-5-2.7L3.3 15a1.6 1.6 0 0 1 2.6-1.8L8 15.5',
		palette: 'M12 21a9 9 0 1 1 9-9c0 2-1.5 3-3.5 3H16a2 2 0 0 0-1.4 3.4A1.6 1.6 0 0 1 12 21ZM7.5 11h.01M10 7.5h.01M14.5 7.5h.01',
		arrow: 'M5 12h14M13 6l6 6-6 6',
		repeat: 'M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4',
		cursor: 'M12 3v18',
		menu: 'M4 7h16M4 12h16M4 17h16',
		close: 'M6 6l12 12M18 6 6 18',
		mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
		lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
		download: 'M12 4v11m0 0-4-4m4 4 4-4M5 20h14',
		eye: 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
		chart: 'M4 20V11M10 20V5M16 20v-6M2 20h20',
		layers: 'M12 3 2 8l10 5 10-5-10-5ZM2 13l10 5 10-5',
		check: 'M5 12.5 10 17 19 7',
		play: 'M7 5l12 7-12 7z',
		pause: 'M8 5v14M16 5v14',
		history: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2',
		signout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 8l-4 4 4 4M6 12h10',
		target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 12h.01',
		flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
		gauge: 'M4 18a8 8 0 1 1 16 0M12 18l4-6',
		route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6 15V9a4 4 0 0 1 4-4h6M18 9v6a4 4 0 0 1-4 4H8',
		user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0',
		shield: 'M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z',
		info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5M12 8h.01',
		chevron: 'M9 6l6 6-6 6',
		volume: 'M4 9h4l5-4v14l-5-4H4zM16.5 8.5a5 5 0 0 1 0 7',
		mute: 'M4 9h4l5-4v14l-5-4H4zM17 9.5l4 5M21 9.5l-4 5',
		star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
		flame: 'M12 21c-4 0-7-2.7-7-6.5 0-3.3 2.3-5.4 4-7.5.4 2 1.5 3.3 3 3.5-.5-3 .5-5.5 3-7.5.5 3.5 4 5.8 4 11 0 4-3 7-7 7Z',
		trophy: 'M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H4a3 3 0 0 0 4 4M16 6h4a3 3 0 0 1-4 4M12 13v4M8 21h8M9 17h6'
	} as const;
	export type IconName = keyof typeof ICONS;
</script>

<script lang="ts">
	let { name, size = 18, class: className = '' }: { name: IconName; size?: number; class?: string } = $props();
</script>

<svg
	class={`icon-${name} ${className}`}
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.8"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<path d={ICONS[name]} />
</svg>
