<script lang="ts">
	import { chapterOf, keyList, lessonById } from '#lib/courses/catalog.ts';
	import LessonPlayer from '#lib/courses/LessonPlayer.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const lesson = $derived(lessonById(data.lessonId)!);
	const chapter = $derived(chapterOf(lesson));
</script>

<Seo title={`Lesson ${lesson.order}: ${lesson.title}`} description={lesson.summary} noindex />

{#if data.allowed}
	{#key lesson.id}
		<LessonPlayer {lesson} />
	{/key}
{:else}
	<section class="gate" aria-labelledby="gate-title">
		<p class="where">Chapter {chapter.number} · Lesson {lesson.order}</p>
		<h1 id="gate-title">{lesson.title}</h1>
		<p class="summary">{lesson.summary}</p>
		{#if lesson.newKeys.length}<p class="keys">New keys: <b>{keyList(lesson.newKeys)}</b></p>{/if}
		<div class="box">
			<Icon name="lock" size={20} />
			<p>Course lessons are free with an account, which saves your stars, rank and progress on every device.</p>
		</div>
		<div class="actions">
			<a class="btn btn-primary btn-lg" href="/signup">Create a free account <Icon name="arrow" size={18} /></a>
			<a class="btn btn-lg" href="/signin">Sign in</a>
		</div>
		<a class="link-arrow back" href="/learn">Back to the roadmap <Icon name="arrow" size={16} /></a>
	</section>
{/if}

<style>
	.gate {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14px;
		max-width: 620px;
		margin: clamp(16px, 6vh, 64px) auto;
		text-align: center;
	}
	.where {
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-2);
	}
	h1 {
		font-size: clamp(34px, 4.6vw, 52px);
		line-height: 1.05;
	}
	.summary,
	.keys {
		font-size: 17px;
		line-height: 1.55;
		color: var(--ink-2);
	}
	.keys b {
		color: var(--ink);
	}
	.box {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		margin-top: 8px;
		padding: 16px 18px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--surface);
		text-align: left;
		line-height: 1.55;
	}
	.box :global(svg) {
		flex-shrink: 0;
		margin-top: 2px;
	}
	.actions {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		justify-content: center;
		margin-top: 6px;
	}
	.back {
		font-size: 14.5px;
		color: var(--ink-2);
	}
</style>
