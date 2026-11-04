<!--
	Svelte Bits: Branched Menu
	Source: https://github.com/DavidHDev/svelte-bits/blob/8fa93ce9a919dd93678f5ac03e752ee90ca5fead/static/r/branched-menu.json
	Upstream commit: 8fa93ce9a919dd93678f5ac03e752ee90ca5fead
	Licence: MIT + Commons Clause, see THIRD_PARTY_NOTICES. Not covered by the GPL.
	Changes: always open, no toggle, select or hover state; children are links and the accent line and marker follow
	the current page (aria-current) instead of a click; section heads are headings that label their own nav; icons
	from ui/Icon; geometry kept, colors from app.css tokens; scoped classes instead of Tailwind utilities; marker
	placed from the layout instead of measured; bundled demo icons and items dropped.
-->
<script module lang="ts">
	import type { IconName } from '#lib/ui/Icon.svelte';

	export type BranchedMenuLink = { href: string; label: string; icon: IconName };
	export type BranchedMenuSection = { label: string; links: readonly BranchedMenuLink[] };
</script>

<script lang="ts">
	import Icon from '#lib/ui/Icon.svelte';

	let {
		sections,
		current = '',
		rowHeight = 34,
		indent = 38,
		trunk = 12,
		radius = 9,
		headHeight = 34
	}: {
		sections: readonly BranchedMenuSection[];
		/** The current path; its link takes the accent branch and its section the marker. */
		current?: string;
		rowHeight?: number;
		indent?: number;
		trunk?: number;
		radius?: number;
		headHeight?: number;
	} = $props();

	const id = $props.id();
	const PAD = 4;
	const r = $derived(Math.min(radius, rowHeight / 2 - 2));
	const endX = $derived(indent - 8);
	const rowY = (k: number) => PAD + k * rowHeight + rowHeight / 2;
	const branch = (k: number) => `M ${trunk} ${rowY(k) - r} A ${r} ${r} 0 0 0 ${trunk + r} ${rowY(k)} H ${endX}`;
	const reach = (k: number) => `M ${trunk} 0 V ${rowY(k) - r} A ${r} ${r} 0 0 0 ${trunk + r} ${rowY(k)} H ${endX}`;
	const length = (k: number) => rowY(k) - r + (Math.PI * r) / 2 + (endX - trunk - r);
	const isCurrent = (href: string) => href === current;
</script>

{#each sections as section, i (section.label)}
	{@const on = section.links.some((l) => isCurrent(l.href))}
	{@const bodyH = PAD * 2 + section.links.length * rowHeight}
	<nav class="branched" aria-labelledby="{id}-{i}" style:--bm-row="{rowHeight}px" style:--bm-indent="{indent}px" style:--bm-head="{headHeight}px">
		<span class="marker" class:on aria-hidden="true"></span>
		<h2 id="{id}-{i}" class="head">{section.label}</h2>
		<div class="body" style:height="{bodyH}px">
			<svg width={indent} height={bodyH} aria-hidden="true">
				<path class="line" d="M {trunk} 0 V {rowY(section.links.length - 1) - r}" />
				{#each section.links as link, k (link.href)}
					<path class="line" d={branch(k)} />
				{/each}
				{#each section.links as link, k (link.href)}
					<path class="accent" d={reach(k)} style:stroke-dasharray={length(k)} style:stroke-dashoffset={isCurrent(link.href) ? 0 : length(k)} />
				{/each}
			</svg>
			<ul>
				{#each section.links as link (link.href)}
					<li>
						<a href={link.href} aria-current={isCurrent(link.href) ? 'page' : undefined}>
							<Icon name={link.icon} size={16} />
							<span>{link.label}</span>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</nav>
{/each}

<style>
	/* A rail down the left fading out, the section head on it, and a trunk with a curved branch to every link. */
	.branched {
		position: relative;
		display: flex;
		flex-direction: column;
		width: fit-content;
		max-width: 100%;
		padding-left: var(--space-16);
		line-height: var(--lh-base);
	}
	.branched::before {
		content: '';
		position: absolute;
		top: 8px;
		bottom: 0;
		left: 0;
		width: 2px;
		border-radius: 1px;
		background: linear-gradient(to bottom, var(--line) 0%, var(--line) 55%, transparent 100%);
	}
	.marker {
		position: absolute;
		top: calc((var(--bm-head) - 16px) / 2);
		left: 0;
		z-index: 1;
		width: 2px;
		height: 16px;
		border-radius: 1px;
		background: var(--ink);
		opacity: 0;
		transition: opacity 150ms ease;
	}
	.marker.on {
		opacity: 1;
	}
	.head {
		display: flex;
		align-items: center;
		height: var(--bm-head);
		font-family: var(--font-sans);
		font-size: var(--fs-15);
		font-weight: var(--fw-semibold);
		color: var(--ink);
	}
	.body {
		position: relative;
		box-sizing: border-box;
		padding: var(--space-4) 0;
	}
	svg {
		position: absolute;
		top: 0;
		left: 0;
		overflow: visible;
		pointer-events: none;
	}
	path {
		fill: none;
		stroke-width: 1.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.line {
		stroke: var(--line);
	}
	.accent {
		stroke: var(--ink);
		transition: stroke-dashoffset 400ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	a {
		display: flex;
		align-items: center;
		gap: var(--space-8);
		height: var(--bm-row);
		padding-left: var(--bm-indent);
		font-size: var(--fs-15);
		color: var(--ink-2);
		text-decoration: none;
		white-space: nowrap;
		border-radius: 3px;
		transition: color 140ms ease;
	}
	a:hover,
	a[aria-current='page'] {
		color: var(--ink);
	}
	a[aria-current='page'] {
		font-weight: var(--fw-semibold);
	}
	@media (prefers-reduced-motion: reduce) {
		.accent,
		.marker {
			transition: none;
		}
	}
</style>
