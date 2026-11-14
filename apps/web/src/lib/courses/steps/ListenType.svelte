<script lang="ts">
	import { claimTyping } from '#lib/ui/typing-focus.ts';
	import { onDestroy, onMount, tick, untrack } from 'svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import PeekRating from '#lib/bits/PeekRating.svelte';
	import StatusMark, { type StatusMarkStatus } from '#lib/bits/StatusMark.svelte';
	import WakeSlider from '#lib/bits/WakeSlider.svelte';
	import ClipWave from './ClipWave.svelte';
	import GameFrame from './GameFrame.svelte';
	import { settings } from '#lib/settings.svelte.ts';
	import { sound } from '#lib/voice/audio.svelte.ts';
	import { voice, type Speed } from '#lib/voice/player.svelte.ts';
	import { flagWord } from '#lib/voice/status.ts';
	import type { ClipShape } from '#lib/voice/shape.ts';
	import { describe, plain, spoken, type Part, type Slot } from '../align.ts';
	import { COURSE_WORDS, compareLetters, loadHeardData, type HeardData, type HeardResult, type HeardSetId } from '@sqwer/content';
	import { activityWords, seeded } from '../generate.ts';
	import { BATCH, LOOKAHEAD, batchLevel } from '#lib/games/listen/run.ts';
	import { grade, pointsOf, type Answer, type Outcome } from '#lib/games/listen/score.ts';
	import { canReplay, countsAsReplay, replayLimit, result as roundResult, newRound, type RoundResult } from '#lib/games/listen/round.ts';
	import { WordMemory } from '#lib/games/listen/memory.ts';
	import { ratingOf, setRating } from '#lib/games/listen/ratings.ts';
	import { pick } from '#lib/games/listen/pick.ts';
	import type { StepResult } from '../types.ts';

	/** Endless play: words come one after another from the level's pool until the player stops. */
	export interface ListenFeed {
		level: number;
		adaptive: boolean;
		words: (level: number) => Promise<string[]>;
		/** After every answer: all answers so far and the level the next words come from. */
		onanswer: (answers: Answer[], level: number) => void;
	}

	/** Listen and type: hear a word, type it, see what was said against what was typed, continue. */
	interface Props {
		pool: string;
		focus: string;
		words?: readonly string[];
		/** Lessons: words in the exercise, words needed to pass, and the result. */
		count?: number;
		target?: number;
		oncomplete?: (r: StepResult) => void;
		feed?: ListenFeed;
		/** Word set for sound-alikes and British spellings; lessons use the course words. */
		set?: HeardSetId;
		/** A practice round: these words, ungraded, then onpracticed. */
		practice?: boolean;
	}

	let { pool, focus, words, count = 6, target = 4, oncomplete, feed, set = 'course', practice = false }: Props = $props();
	const endless = untrack(() => !!feed);
	const memory = new WordMemory();
	/** Sound-alike groups and British spellings of the set, loaded with it. */
	let heardData = $state<HeardData | undefined>();
	untrack(() => void loadHeardData(set).then((d) => (heardData = d), () => {}));
	/** Words a misheard answer can be: the course words and the endless pools seen so far. */
	const known = new Set<string>(COURSE_WORDS);

	/**
	 * Lesson words, by the picker (lib/games/listen/pick.ts): the exercise's words, topped up from course words with
	 * taught keys when it has too few; confusable words never in one round, recent ones resting.
	 */
	const allowed = untrack(() => new Set([...pool]));
	let list = $state(untrack(() => {
		if (feed) return [];
		if (practice) return [...(words ?? [])];
		const rand = seeded(Date.now() % 100000);
		const given = activityWords(pool, focus, words, rand).filter((w) => w.length >= 3);
		const extra = COURSE_WORDS.filter((w) => w.length >= 4 && w.length <= 9 && !given.includes(w) && [...w].every((c) => allowed.has(c)));
		const from = given.length >= count * 2 ? given : [...given, ...extra];
		return pick(from, { n: count, rand, memory, voiced: (w) => voice.state(w) !== 'missing' });
	}));
	// Words are heard, unless sound is turned off in settings or the browser has none: then each is shown briefly.
	const speech = $derived(!settings.showWords && voice.supported);

	interface Feedback {
		outcome: Outcome;
		typed: string;
		/** The word as written (capitals kept), and both spellings when it has a British one. */
		word: string;
		spellings?: { american: string; british: string };
		slots: Slot[];
		/** Letters are marked only when a few differ; otherwise the two words are shown plainly. */
		marked: boolean;
		note: Part[];
		/** Text version for screen readers. */
		said: string;
	}

	let started = $state(false);
	let index = $state(0);
	let value = $state('');
	let showWord = $state(false);
	let feedback = $state<Feedback | null>(null);
	let outcomes = $state<Outcome[]>([]);
	/** Lessons: every answer, for the review. */
	let done = $state<Answer[]>([]);
	let reviewing = $state(false);
	/** Practice: ungraded, every word shown in the review. Set by the prop or by "Practice the missed words". */
	let practiceMode = $state(untrack(() => practice));
	let over = $state<{ won: boolean; text: string } | null>(null);
	/** What is playing now; null when quiet. */
	let playing = $state<Speed | null>(null);
	let plays = $state(0);
	/** Replays of this word (the first play not counted), and when it first played. */
	let replays = $state(0);
	let firstPlay = 0;
	let input: HTMLInputElement | undefined = $state();
	let next: HTMLButtonElement | undefined = $state();
	let timers: ReturnType<typeof setTimeout>[] = [];

	/* Endless: the word in play and the ones fetched behind it, answers so far, the level words come from. */
	let queue = $state<string[]>([]);
	let answers = $state<Answer[]>([]);
	let level = $state(untrack(() => feed?.level ?? 0));
	let loadError = $state(false);
	let filling = false;
	/** Set when the queue ran dry: the next word plays as soon as it arrives. */
	let waiting = false;

	const word = $derived(endless ? (queue[0] ?? '') : (list[index] ?? ''));
	const upcoming = $derived(endless ? queue.slice(1) : list.slice(index + 1));
	/** Points so far: exact and accepted 1, close half. */
	const correct = $derived(pointsOf(done));
	const answered = $derived(outcomes.filter(Boolean).length);

	/* ---------------------------------------------------------------- clips: made ahead, shown when ready */

	const heard = (w: string) => ['ready', 'playing'].includes(voice.state(w) ?? '');
	const preparing = $derived(speech && !!word && ['loading', undefined].includes(voice.state(word)));
	const ready = $derived(upcoming.filter(heard).length);
	const hasClip = $derived(heard(word));

	let shape = $state<ClipShape | null>(null);
	$effect(() => {
		const w = word;
		shape = null;
		if (!hasClip) return;
		void voice.shape(w, 'normal', 24).then((s) => {
			if (w === word) shape = s;
		});
	});

	/* A word the voice has no clip for is swapped for another before it comes up; it is never shown instead. */
	$effect(() => {
		if (!speech) return;
		if (endless) {
			const gone = queue.filter((w, i) => voice.state(w) === 'missing' && !(i === 0 && feedback));
			if (!gone.length) return;
			untrack(() => {
				const first = gone.includes(queue[0]!);
				queue = queue.filter((w) => !gone.includes(w));
				if (first && started && !feedback) {
					if (queue.length) present();
					else waiting = true;
				}
				void fill();
			});
			return;
		}
		list.forEach((w, i) => {
			if (i < index || (i === index && feedback) || voice.state(w) !== 'missing') return;
			untrack(() => {
				const spare = COURSE_WORDS.find((c) => c.length >= 4 && c.length <= 9 && !list.includes(c) && voice.state(c) !== 'missing' && [...c].every((ch) => allowed.has(ch)));
				if (!spare) return;
				list[i] = spare;
				voice.prepare([spare]);
				if (i === index && started) present();
			});
		});
	});

	onDestroy(() => {
		timers.forEach(clearTimeout);
		voice.stop();
	});
	onMount(() => {
		// Clips are made while the intro is read, so the first word plays at once.
		if (endless) void fill();
		else if (speech) voice.prepare(list);
	});

	/** Keeps the word in play and LOOKAHEAD more fetched, from the current level's pool. */
	async function fill() {
		if (!feed || filling) return;
		filling = true;
		try {
			while (queue.length < 1 + LOOKAHEAD) {
				const from = await feed.words(level);
				for (const w of from) known.add(w);
				const taken = [...answers.slice(-BATCH).map((a) => a.word), ...queue];
				const add = pick(from, { n: 1 + LOOKAHEAD - queue.length, rand: Math.random, memory, level, taken, voiced: (w) => voice.state(w) !== 'missing', data: heardData });
				if (!add.length) break;
				queue.push(...add);
				if (speech) voice.prepare(add);
				if (waiting) {
					waiting = false;
					present();
				}
			}
			loadError = false;
		} catch {
			loadError = true;
		} finally {
			filling = false;
		}
	}

	/* ---------------------------------------------------------------- word ratings, kept on this device */

	let rating = $state(0);
	function rate(n: number) {
		// One or two stars lists the word on the Voice page of the computer running this copy; a better rating takes it off.
		if ((n > 0 && n <= 2) !== (rating > 0 && rating <= 2)) void flagWord(word, n > 0 && n <= 2);
		rating = n;
		setRating(word, n);
	}

	/* ---------------------------------------------------------------- play */

	/** Endless levels limit replays; lessons and practice do not. */
	const replayLevel = $derived(endless ? level : null);
	const allows = (speed: Speed) => !plays || canReplay(replayLevel, replays, speed);
	const left = $derived(replayLimit(replayLevel) - replays);

	async function play(speed: Speed = 'normal') {
		if (!word || feedback) return;
		if (!speech) return flash();
		if (!allows(speed)) return;
		const w = word;
		if (countsAsReplay(replayLevel, plays === 0, speed)) replays++;
		if (!plays) firstPlay = performance.now();
		playing = speed;
		plays++;
		const said = await voice.say(w, speed);
		if (said === 'played') failures = 0;
		else if (said === 'error') failures++;
		if (w !== word) return;
		playing = null;
		// Sound itself failed: the word is shown. A missing clip is swapped for another word above.
		if (said === 'error') flash();
	}

	/** Browsers that still hold the sound after Start: a tap turns it on and plays the word. */
	async function turnOn() {
		if (await sound.unlock()) void play();
	}

	/** Clips that failed in a row: from two on, the status row says the voice is not answering. */
	let failures = $state(0);

	/** Shows the word for a moment, when it cannot be heard. */
	function flash() {
		showWord = true;
		timers.push(setTimeout(() => (showWord = false), 1200));
	}

	function present() {
		feedback = null;
		value = '';
		plays = 0;
		replays = 0;
		firstPlay = performance.now();
		playing = null;
		rating = ratingOf(word);
		void play();
		// While this word is shown: its slow clip and the next word.
		if (speech) {
			voice.prepare([word], 'slow');
			voice.prepare(upcoming.slice(0, 1));
		}
		requestAnimationFrame(() => input?.focus({ preventScroll: true }));
	}

	function begin() {
		started = true;
		if (endless && !queue.length) {
			waiting = true;
			void fill();
			return;
		}
		present();
	}

	/** Graded letters as the explanation draws them: a swap or a slip reads as a changed letter. */
	const SLOT: Record<HeardResult['letters'][number]['mark'], Slot['mark']> = { right: 'same', extra: 'extra', missing: 'missing', changed: 'wrong', swapped: 'wrong' };

	/** One plain sentence on how the answer was graded, naming the letters. */
	function noteFor(r: HeardResult, slots: Slot[]): Part[] {
		const typed = r.typed;
		const w = r.word.toLowerCase();
		const off = r.letters.filter((l) => l.mark !== 'right');
		const half = ' Half a point.';
		switch (r.kind) {
			case 'exact':
				return ['Spelled exactly right.'];
			case 'accepted':
				if (r.accepted === 'written') return ['Counts. Written ', { letter: r.word }, '.'];
				if (r.accepted === 'sound') return [{ letter: typed }, ' sounds the same as ', { letter: w }, ', so it counts.'];
				return ['Another spelling of the same word. Both count.'];
			case 'close':
				switch (r.mistake) {
					case 'sounds-right':
						return ['Spelled the way it sounds.', half];
					case 'swap':
						return ['Two letters swapped: ', { letter: off[0]!.word }, ' and ', { letter: off[1]!.word }, '.', half];
					case 'double':
						return ['One letter doubled: ', { letter: off[0]!.typed }, '.', half];
					case 'neighbor':
						return off[0]!.mark === 'extra'
							? ['A brushed key added ', { letter: off[0]!.typed }, '.', half]
							: ['A slip to the key next door: ', { letter: off[0]!.typed }, ' for ', { letter: off[0]!.word }, '.', half];
					case 'missing':
						return ['One letter left out: ', { letter: off[0]!.word }, '.', half];
					case 'extra':
						return ['One letter added: ', { letter: off[0]!.typed }, '.', half];
					default:
						return ['One letter off: ', { letter: off[0]!.typed }, ' for ', { letter: off[0]!.word }, '.', half];
				}
			case 'misheard':
				return [{ letter: typed }, ' is another word. The word was ', { letter: w }, '.'];
			default:
				return describe(slots);
		}
	}

	/** Fast mode: a full point moves on the moment it is typed; Enter only plays the word again. */
	const fast = $derived(settings.fastMode);
	/** The word just typed right in fast mode, shown for a moment in the status row. */
	let quick = $state<string | null>(null);

	const gradeOf = (typed: string) => grade(word, typed, { data: heardData, isWord: (w) => w !== word && known.has(w) });

	/** Answers hold letters only: no digits, symbols, spaces or punctuation (don't is typed dont and counts). */
	const lettersOnly = (text: string) => text.toLowerCase().replace(/[^a-z]/g, '');

	function typed(next: string) {
		value = lettersOnly(next);
		if (input && input.value !== value) input.value = value;
		if (fast && started && !feedback && word && value && gradeOf(value).points === 1) void submit();
	}

	/** Checks the answer. `giveUp` checks even an empty one: fast mode's Skip. */
	async function submit(giveUp = false) {
		const typed = value.trim();
		if ((!typed && !giveUp) || feedback || !word) return;
		voice.stop();
		playing = null;
		const r = gradeOf(typed);
		const outcome = r.kind;
		outcomes[endless ? answers.length : index] = outcome;
		const a: Answer = { word, typed: r.typed, outcome, points: r.points, level, plays, ms: Math.round(performance.now() - firstPlay) };
		memory.record(word, outcome);
		if (feed) {
			answers.push(a);
			if (answers.length % BATCH === 0) level = batchLevel(level, answers.slice(-BATCH), feed.adaptive);
			feed.onanswer($state.snapshot(answers), level);
		} else done[index] = a;
		// Fast mode: a full point goes straight to the next word, no explanation.
		if (fast && r.points === 1) {
			const right = word;
			quick = right;
			timers.push(setTimeout(() => quick === right && (quick = null), 900));
			advance();
			return;
		}
		const slots: Slot[] = r.letters.map((l) => ({ typed: l.typed, word: l.word, mark: outcome === 'accepted' && l.mark !== 'right' ? 'variant' : SLOT[l.mark] }));
		const differ = slots.filter((s) => s.mark !== 'same').length;
		const note = noteFor(r, slots);
		feedback = {
			outcome,
			typed: r.typed,
			word: r.word,
			spellings: r.spellings,
			slots,
			marked: outcome === 'accepted' || outcome === 'close' || (outcome !== 'misheard' && differ <= 3 && slots.some((s) => s.mark === 'same')),
			note,
			said: `${GRADE[outcome]}. ${spoken(r.typed, word)} ${plain(note)}${r.spellings ? ` American ${r.spellings.american}, British ${r.spellings.british}.` : ''}`
		};
		await tick();
		next?.focus({ preventScroll: true });
	}

	function proceed() {
		if (!feedback || over) return;
		advance();
	}

	/** On to the next word, or the review after the last one. */
	function advance() {
		if (over) return;
		if (endless) {
			voice.stop();
			queue.shift();
			if (queue.length) present();
			else {
				feedback = null;
				waiting = true;
			}
			void fill();
			return;
		}
		if (index + 1 < list.length) {
			index++;
			present();
			return;
		}
		// Every word answered: the review, with the missed words to practice.
		voice.stop();
		reviewing = true;
	}

	/** The round's result, from its answers. */
	const roundOut = $derived.by(() => {
		const r = newRound(list, practiceMode ? 0 : target);
		r.answers = done;
		return roundResult(r);
	});
	/** The graded round's result, kept while its missed words are practiced. */
	let graded = $state<RoundResult | null>(null);

	/** Leaves the review: the lesson goes on with the graded round's result. */
	function finish() {
		if (over) return;
		const r = graded ?? roundOut;
		over = { won: r.passed, text: r.summary };
		timers.push(setTimeout(() => oncomplete?.({ passed: r.passed, accuracy: r.accuracy, summary: r.summary }), 600));
	}

	/** An ungraded round of the words missed, then the review again. */
	function practiceMissed() {
		graded = roundOut;
		list = [...roundOut.missed];
		index = 0;
		done = [];
		outcomes = [];
		reviewing = false;
		practiceMode = true;
		present();
	}

	let review: HTMLButtonElement | undefined = $state();
	$effect(() => {
		if (reviewing) void tick().then(() => review?.focus({ preventScroll: true }));
	});

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && fast) {
			e.preventDefault();
			void submit(true);
			return;
		}
		if (e.key !== 'Enter') return;
		e.preventDefault();
		if (e.shiftKey) void play('slow');
		else if (fast || !value.trim()) void play();
		else void submit();
	}

	$effect(() =>
		claimTyping({
			focus: () => {
				if (!started || over) return;
				if (feedback) next?.focus({ preventScroll: true });
				else input?.focus({ preventScroll: true });
			},
			key: (e) => {
				if (!started || over) return;
				if (reviewing) {
					if (e.key === 'Enter') review?.click();
					return;
				}
				if (feedback) {
					if (e.key === 'Enter') proceed();
					return;
				}
				if (!input || input.disabled) return;
				input.focus({ preventScroll: true });
				if (e.key === 'Enter' || e.key === 'Escape') onkeydown(e);
				else if (e.key === 'Backspace') typed(value.slice(0, -1));
				else if (e.key.length === 1) typed(value + e.key);
			}
		})
	);

	const GRADE: Record<Outcome, string> = { exact: 'Correct', accepted: 'Accepted', close: 'Close', misheard: 'Misheard', wrong: 'Not quite' };
	/** Close answers show a check in the streak color: half right. */
	const MARK: Record<Outcome, StatusMarkStatus> = { exact: 'done', accepted: 'done', close: 'done', misheard: 'failed', wrong: 'failed' };
	/** Endless keeps the last few results in view; lessons show every word of the exercise. */
	const RECENT = 7;

	interface Dot {
		key: number;
		outcome: Outcome | null;
		current: boolean;
	}
	const dots = $derived.by((): Dot[] => {
		if (!endless) return list.map((_, i) => ({ key: i, outcome: outcomes[i] ?? null, current: started && i === index && !outcomes[i] }));
		const from = Math.max(0, answers.length - RECENT);
		const done = answers.slice(from).map((a, i) => ({ key: from + i, outcome: a.outcome, current: false }));
		return feedback ? done : [...done, { key: answers.length, outcome: null, current: started }];
	});
	const position = $derived(endless ? `Word ${answers.length + (feedback ? 0 : 1)}` : `Word ${Math.min(index + 1, list.length)} of ${list.length}`);
	const waving = $derived(playing !== null && voice.speaking);
</script>

<GameFrame
	title={speech ? 'Listen and type' : 'Look and type'}
	icon="volume"
	how={speech
		? `You will hear ${list.length} words, one at a time. Type each word and press Enter. Words that sound the same and British spellings count; a slip of one letter scores half a point. Turn your sound on.`
		: `${settings.showWords ? 'Sound is off in your settings' : 'This browser cannot play sound'}, so each of the ${list.length} words is shown for a moment instead. Type it from memory and press Enter.`}
	goal={`Score ${target} of ${list.length} points`}
	progress={Math.min(1, correct / Math.max(1, target))}
	status={`${answered} / ${list.length} words`}
	{over}
	onstart={begin}
	onready={() => void sound.unlock()}
	autostart={endless}
	height={460}
>
	{#if reviewing}
		<!-- Every answer of the round, then on to the lesson; missed words can be practiced first. -->
		<div class="review">
			<div class="review-head">
				<p class="review-title">{practiceMode ? 'Practice round' : 'Your round'}</p>
				<p class="review-score">{practiceMode ? 'Not scored' : `${roundOut.points} of ${list.length} points · goal ${target}`}</p>
			</div>
			<ol class="answers">
				{#each done as a, i (i)}
					<li class:close={a.outcome === 'close'}>
						<StatusMark status={MARK[a.outcome]} size={18} decorative />
						<span class="answer-word">{a.word}</span>
						<span class="answer-typed">
							{#if a.outcome === 'exact'}typed right{:else}you typed
								<span class="mono">{#each compareLetters(a.typed, a.word.toLowerCase()) as l, j (j)}{#if l.typed}<span class:bad={l.mark !== 'right'}>{l.typed}</span>{/if}{/each}</span>{/if}
						</span>
						<span class="answer-meta">{GRADE[a.outcome]} · {a.plays === 1 ? 'heard once' : `heard ${a.plays} times`} · {(a.ms / 1000).toFixed(1)} s</span>
					</li>
				{/each}
			</ol>
			<div class="footer">
				<div class="aside">
					{#if !practiceMode && !graded && roundOut.missed.length}
						<button type="button" class="btn" onclick={practiceMissed}>Practice the missed words</button>
					{/if}
				</div>
				<button type="button" class="btn btn-primary act" bind:this={review} onclick={finish}>Finish <Icon name="arrow" size={18} /></button>
			</div>
		</div>
	{:else}
	<!-- One column; every row keeps its height, so answering swaps content in place and nothing moves. -->
	<div class="play">
		<div class="top">
			<ol class="marks" aria-label={position}>
				{#each dots as d (d.key)}
					<li class:close={d.outcome === 'close'}>
						{#if d.outcome}<StatusMark status={MARK[d.outcome]} size={18} decorative />
						{:else}<span class="dot" class:current={d.current}></span>{/if}
					</li>
				{/each}
			</ol>
			{#if speech && started && upcoming.length}
				<p class="ahead">{ready === upcoming.length ? `Next ${ready} ready` : `Preparing next words: ${ready} of ${upcoming.length}`}</p>
			{/if}
		</div>

		<!-- The player: always on screen, with the volume. -->
		<div class="player" class:mute={!speech}>
			{#if speech}
				<button type="button" class="btn icon" aria-label="Play the word again" onclick={() => play('normal')} disabled={!started || playing !== null || preparing || !!feedback || !allows('normal')}>
					<Icon name="play" size={18} />
				</button>
			{/if}
			<div class="sound">
				{#if showWord}
					<p class="shown" aria-live="polite">{word}</p>
				{:else}
					<ClipWave
						{shape}
						playing={waving}
						progress={() => (voice.speaking ? voice.progress() : null)}
						estimate={Math.max(500, word.length * (playing === 'slow' ? 160 : 100))}
						bars={24}
					/>
				{/if}
			</div>
			{#if speech}
				<button type="button" class="btn slow" onclick={() => play('slow')} disabled={!started || playing !== null || preparing || !!feedback || !allows('slow')}>Slow</button>
				<div class="volume">
					<Icon name={voice.volume === 0 ? 'mute' : 'volume'} size={18} />
					<WakeSlider value={Math.round(voice.volume * 100)} onChange={(v) => voice.setVolume(v / 100)} step={5} ariaLabel="Volume" formatValue={(v) => `${v}%`} />
					<span class="pct" aria-hidden="true">{Math.round(voice.volume * 100)}%</span>
				</div>
			{/if}
		</div>

		<p class="state" aria-live="polite">
			{#if feedback}
				<span class="grade" class:close={feedback.outcome === 'close'} id="listen-grade"><StatusMark status={MARK[feedback.outcome]} size={20} decorative /> {GRADE[feedback.outcome]}</span>
			{:else if quick}<span class="grade quick"><StatusMark status="done" size={20} decorative /> {quick}</span>
			{:else if loadError}The words could not be loaded. Stop and start again.
			{:else if speech && started && failures >= 2}<span class="trouble"><Icon name="mute" size={16} /> The voice is not answering. Words are shown instead.</span>
			{:else if speech && started && sound.state === 'blocked'}<button type="button" class="btn on" onclick={turnOn}><Icon name="volume" size={16} /> Tap to turn sound on</button>
			{:else if preparing || (endless && started && !word)}<span class="spin" aria-hidden="true"></span> Preparing the voice…
			{:else if playing}{playing === 'slow' ? 'Playing slowly…' : 'Playing…'}
			{:else if !started}Press Start to hear the first word
			{:else if !speech}Shown for a moment
			{:else if plays}Heard {plays === 1 ? 'once' : `${plays} times`}{#if Number.isFinite(left)} · {left === 0 ? 'no replays left' : left === 1 ? '1 replay left' : `${left} replays left`}{/if}{/if}
		</p>

		<div class="answer">
			{#if feedback}
				<p class="box" aria-hidden="true">
					{#each feedback.slots as s, i (i)}{#if s.typed}<span class:bad={feedback.marked && (s.mark === 'extra' || s.mark === 'wrong')} class:variant={s.mark === 'variant'}>{s.typed}</span>{/if}{/each}
				</p>
				<p class="sr-only" role="status">{feedback.said}</p>
			{:else}
				<label>
					<span class="sr-only">Your answer</span>
					<input
						bind:this={input}
						data-typing-input
						{value}
						oninput={(e) => typed(e.currentTarget.value)}
						{onkeydown}
						class="box"
						type="text"
						name="heard"
						autocomplete="off"
						autocapitalize="off"
						spellcheck="false"
						disabled={!started || !!over}
						placeholder="Type what you hear…"
						data-testid="listen-input"
						data-tab-restart
					/>
				</label>
			{/if}
		</div>

		<div class="middle">
			{#if feedback}
				<div class="result" class:both={!!feedback.spellings} aria-hidden="true">
					<p class="label">The word</p>
					<p class="word">
						{#each feedback.slots as s, i (i)}{#if s.word}<span class:fix={feedback.marked && (feedback.outcome === 'wrong' || feedback.outcome === 'close') && (s.mark === 'missing' || s.mark === 'wrong')}>{s.word}</span>{/if}{/each}
					</p>
					<p class="why">
						{#each feedback.note as part, i (i)}{#if typeof part === 'string'}{part}{:else}<b class="letter">{part.letter}</b>{/if}{/each}
					</p>
					{#if feedback.spellings}<p class="spellings">American <i>{feedback.spellings.american}</i> · British <i>{feedback.spellings.british}</i></p>{/if}
				</div>
			{:else}
				<p class="keys">
					{#if fast}<span>Fast mode: a right word moves on by itself</span>
						{#if speech}<span><kbd>Enter</kbd> Play again</span>{/if}
						<span><kbd>Esc</kbd> Skip</span>
					{:else}<span><kbd>Enter</kbd> Check</span>
						{#if speech}<span><kbd>Enter</kbd> on empty: play again</span>{/if}{/if}
					{#if speech}<span><kbd>Shift</kbd>&nbsp;+&nbsp;<kbd>Enter</kbd> Slow</span>{/if}
					{#if speech && sound.silentSwitch}<span>No sound? Check the silent switch.</span>{/if}
				</p>
			{/if}
		</div>

		<!-- The primary action never moves: Check while typing, Continue after. -->
		<div class="footer">
			<div class="aside">
				{#if feedback && speech}
					<span>Voice clarity</span>
					<PeekRating value={rating} onChange={rate} size={18} lift={4} ariaLabel="How clear was the voice" labels={['Unclear', 'Hard to follow', 'Fine', 'Clear', 'Very clear']} />
				{/if}
			</div>
			{#if feedback}
				<button type="button" class="btn btn-primary act" bind:this={next} onclick={proceed}>
					{endless || index + 1 < list.length ? 'Continue' : 'See the round'} <Icon name="arrow" size={18} />
				</button>
			{:else}
				{#if fast}
					<button type="button" class="btn act" onclick={() => void submit(true)} disabled={!started || !word}>Skip</button>
				{:else}
					<button type="button" class="btn btn-primary act" onclick={() => void submit()} disabled={!started || !value.trim()}>Check</button>
				{/if}
			{/if}
		</div>
	</div>
	{/if}
</GameFrame>

<style>
	.play {
		display: grid;
		grid-template-rows: 20px 64px 28px 64px 132px 48px; /* off-scale: fixed rows of the stage */
		align-items: center;
		gap: var(--space-12);
		width: min(100%, var(--w-narrow));
		margin: 0 auto;
		padding: var(--space-24) var(--space-16);
	}
	/* No focus rings inside the game: the field shows its caret, buttons take their hover tone. */
	.play :global(:focus-visible) {
		outline: none;
		box-shadow: none;
	}
	.play :global(.btn:not(.btn-primary):focus-visible) {
		background: var(--surface-2);
		border-color: var(--ink-3);
	}
	.play :global(.btn-primary:focus-visible) {
		filter: brightness(0.94);
	}

	.top {
		position: relative;
		display: flex;
		justify-content: center;
	}
	.marks {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.marks li {
		display: grid;
		place-items: center;
		width: 18px;
		height: 18px;
	}
	.dot {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		border: 1.5px solid var(--line-strong);
	}
	.dot.current {
		border: 2px solid var(--accent);
	}
	.ahead {
		position: absolute;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		font-size: var(--fs-12);
		color: var(--ink-3);
		font-variant-numeric: tabular-nums;
	}

	.player {
		display: flex;
		align-items: center;
		gap: var(--space-12);
		height: 100%;
		padding: 0 var(--space-10);
		border-radius: var(--radius);
		background: var(--surface);
	}
	.player.mute {
		justify-content: center;
	}
	.btn.icon {
		flex: none;
		width: 44px;
		padding: 0;
	}
	.btn.slow {
		flex: none;
		padding: 0 var(--space-12);
	}
	/* Fits the 28px status row. */
	.state .btn.on {
		min-height: 28px;
		padding: 0 var(--space-12);
		gap: var(--space-6);
		font-size: var(--fs-14);
	}
	.sound {
		flex: 1;
		min-width: 0;
		height: 40px;
	}
	.shown {
		display: grid;
		place-items: center;
		height: 100%;
		font-family: var(--font-mono);
		font-size: var(--fs-28);
		font-weight: var(--fw-semibold);
		color: var(--ink);
	}
	.volume {
		display: flex;
		flex: none;
		align-items: center;
		gap: var(--space-8);
		width: 168px;
		padding-left: var(--space-12);
		border-left: 1px solid var(--line);
		color: var(--ink-2);
	}
	.pct {
		min-width: 4ch;
		font-size: var(--fs-13);
		font-variant-numeric: tabular-nums;
		text-align: right;
	}

	.state {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-8);
		font-size: var(--fs-14);
		color: var(--ink-2);
	}
	.trouble {
		display: inline-flex;
		align-items: center;
		gap: var(--space-6);
		color: var(--ink);
	}
	.spin {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		border: 2px solid var(--line-strong);
		border-top-color: var(--ink);
		animation: spin 800ms linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.grade {
		display: inline-flex;
		align-items: center;
		gap: var(--space-8);
		font-size: var(--fs-18);
		font-weight: var(--fw-semibold);
		color: var(--ink);
	}

	.answer,
	.answer label {
		display: block;
		height: 100%;
	}
	.box {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		margin: 0;
		padding: 0 var(--space-16);
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		background: var(--bg);
		color: var(--ink);
		font-family: var(--font-mono);
		font-size: clamp(22px, 2.6vw, 30px); /* off-scale: lesson drill typing size from the design guide */
		font-weight: var(--fw-semibold);
		letter-spacing: 0.04em; /* off-scale: mono letters read apart */
		text-align: center;
		overflow: hidden;
		white-space: nowrap;
		touch-action: manipulation;
	}
	input.box::placeholder {
		font-weight: var(--fw-regular);
		color: var(--ink-3);
	}
	input.box:disabled {
		background: var(--surface);
	}
	.box .bad {
		font-weight: var(--fw-bold);
		color: var(--error);
	}
	.box .variant {
		color: var(--ink-2);
	}

	.middle {
		display: grid;
		place-items: center;
		height: 100%;
		overflow: hidden;
		text-align: center;
	}
	.result {
		display: grid;
		justify-items: center;
		gap: var(--space-4);
	}
	.label {
		font-size: var(--fs-12);
		font-weight: var(--fw-semibold);
		letter-spacing: var(--tr-caps);
		text-transform: uppercase;
		color: var(--ink-3);
	}
	.word {
		font-family: var(--font-mono);
		font-size: clamp(26px, 3.4vw, 38px); /* off-scale: the answer word is the largest thing in the panel */
		font-weight: var(--fw-semibold);
		letter-spacing: 0.04em; /* off-scale: mono letters read apart */
		line-height: var(--lh-snug);
		color: var(--ink);
		white-space: nowrap;
	}
	.word .fix {
		font-weight: var(--fw-bold);
		color: var(--success);
	}
	.why {
		display: -webkit-box;
		max-width: 46ch;
		margin-top: var(--space-4);
		font-size: var(--fs-15);
		line-height: var(--lh-body);
		color: var(--ink-2);
		text-wrap: pretty;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	/* Both spellings take the second line of the note. */
	.both .why {
		-webkit-line-clamp: 1;
		line-clamp: 1;
	}
	.spellings {
		font-size: var(--fs-13);
		color: var(--ink-3);
	}
	.spellings i {
		font-style: normal;
		font-family: var(--font-mono);
		color: var(--ink);
	}
	/* Close: half right, in the streak color (amber is the games area). */
	.close :global(.status-mark),
	.grade.close :global(.status-mark) {
		color: var(--streak);
	}

	.review {
		display: grid;
		grid-template-rows: auto 1fr 48px; /* off-scale: the footer row matches the stage */
		gap: var(--space-16);
		width: min(100%, var(--w-narrow));
		height: 100%;
		margin: 0 auto;
		padding: var(--space-24) var(--space-16);
	}
	.review-head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-4) var(--space-12);
	}
	.review-title {
		font-weight: var(--fw-semibold);
	}
	.review-score {
		font-size: var(--fs-14);
		color: var(--ink-2);
	}
	.answers {
		display: grid;
		align-content: start;
		gap: var(--space-8);
		min-height: 0;
		margin: 0;
		padding: 0;
		overflow: hidden auto;
		list-style: none;
	}
	.answers li {
		display: grid;
		grid-template-columns: auto auto 1fr;
		align-items: center;
		gap: var(--space-2) var(--space-10);
		padding-bottom: var(--space-8);
		border-bottom: 1px solid var(--line);
		font-size: var(--fs-14);
		min-width: 0;
	}
	.answer-word {
		font-family: var(--font-mono);
		font-weight: var(--fw-semibold);
		color: var(--ink);
	}
	.answer-typed {
		color: var(--ink-2);
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.answer-typed .mono {
		font-family: var(--font-mono);
		color: var(--ink);
	}
	.answer-typed .bad {
		font-weight: var(--fw-bold);
		color: var(--error);
	}
	.answer-meta {
		grid-column: 2 / -1;
		font-size: var(--fs-13);
		color: var(--ink-3);
	}
	.letter {
		font-family: var(--font-mono);
		font-weight: var(--fw-bold);
		color: var(--ink);
	}
	.keys {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-6) var(--space-20);
		font-size: var(--fs-13);
		color: var(--ink-3);
	}

	.footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-12);
		height: 100%;
		padding-top: var(--space-12);
		border-top: 1px solid var(--line);
	}
	.aside {
		display: flex;
		align-items: center;
		gap: var(--space-10);
		min-width: 0;
		font-size: var(--fs-13);
		white-space: nowrap;
		color: var(--ink-2);
	}
	/* The stars keep room above them for their tip; it overlaps the row so the stars line up with the label. */
	.aside > :global(:last-child:not(span)) {
		margin-top: calc(-1 * var(--pr-room));
	}
	.act {
		flex: none;
		min-width: 148px; /* off-scale: Check and Continue share one width */
	}
	kbd {
		padding: 1px var(--space-6);
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		background: var(--surface);
		font-family: var(--font-mono);
		font-size: var(--fs-12);
		color: var(--ink-2);
	}

	@media (max-width: 560px) {
		.play {
			grid-template-rows: 20px 108px 28px 56px 132px 56px; /* off-scale: fixed rows of the stage */
			padding: var(--space-20) var(--space-16);
		}
		.ahead {
			display: none;
		}
		.player {
			display: grid;
			grid-template-columns: 44px minmax(0, 1fr) auto;
			grid-template-rows: 44px 36px;
			gap: var(--space-6) var(--space-10);
			padding: var(--space-6) var(--space-10);
		}
		.volume {
			grid-column: 1 / -1;
			width: 100%;
			padding-left: 0;
			border-left: 0;
		}
		.aside > span {
			display: none;
		}
	}
	@media (pointer: coarse) {
		.keys {
			display: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.spin {
			animation: none;
			border-top-color: var(--line-strong);
		}
	}
</style>
