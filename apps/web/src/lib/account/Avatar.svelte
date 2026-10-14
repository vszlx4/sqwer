<script lang="ts">
	import { avatarOf, initials } from '#lib/profile.ts';

	let { name, color, size = 48, src = null }: { name: string; color: string; size?: number; src?: string | null } = $props();
	const c = $derived(avatarOf(color));
</script>

{#if src}
	<img class="avatar photo" {src} alt="" width={size} height={size} style:width={`${size}px`} style:height={`${size}px`} />
{:else}
<span
	class="avatar"
	style:width={`${size}px`}
	style:height={`${size}px`}
	style:font-size={`${Math.round(size * 0.4)}px`}
	style:background={c.css}
	style:color={c.ink}
	aria-hidden="true">{initials(name)}</span
>
{/if}

<style>
	.avatar {
		display: inline-grid;
		place-items: center;
		flex-shrink: 0;
		border-radius: 3px;
		font-weight: 600;
		letter-spacing: 0.02em;
	}
	.photo {
		object-fit: cover;
		background: var(--surface-2);
	}
</style>
