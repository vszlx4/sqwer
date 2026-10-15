<script lang="ts">
	import { qwertyAnsi } from '@sqwer/layouts';
	import Keyboard from '#lib/keyboard/Keyboard.svelte';
	import Prose from '#lib/site/Prose.svelte';
	import Seo from '#lib/site/Seo.svelte';

	const layout = qwertyAnsi('mac');
</script>

<Seo title="How it works" description="How the sqwer keyboard guide, finger mapping and test metrics work." />

<Prose
	kicker="How it works"
	title="Built around your hands, not a textbook."
	lede="sqwer is a place to learn and practise typing: a course of short lessons and games, examinations that measure your progress, and a finger map of your own technique. This page explains how each part works, how results are calculated and how your data is handled."
	crumbs={[{ href: '/about', label: 'How it works' }]}
>
	<h2>The course</h2>
	<p>
		The <a href="/learn">Courses</a> are one long road of short lessons in twelve chapters, from the first two keys,
		F and J, to fluent typing. Each lesson adds a little, using guided drills and six games (key hunt, race, echo,
		falling letters, rhythm and listening), so that every chapter prepares you for the next. Games end when you reach
		their goal, not when a clock runs out. Lessons earn stars; stars earn points and
		ranks, which measure your own progress. <a href="/start">Getting started</a> recommends where to begin.
	</p>

	<h2>The keyboard</h2>
	<p>
		A keyboard is displayed below every test. Each key lights up as you press it: in the accent colour when the
		keystroke is correct and in red when it is incorrect, so that you can see where errors occur without looking at
		your hands.
	</p>
	<p>
		Standard touch-typing technique assigns each finger a column of keys, starting from the home row (<kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> <kbd>F</kbd> and <kbd>J</kbd>
		<kbd>K</kbd> <kbd>L</kbd> <kbd>;</kbd>). Enable <strong>finger zones</strong> to display these assignments in colour:
	</p>
	<figure class="zones">
		<Keyboard {layout} showZones label="Standard finger zones" />
		<figcaption>
			<span><i style="background: var(--f-pinky)"></i>Little finger</span>
			<span><i style="background: var(--f-ring)"></i>Ring finger</span>
			<span><i style="background: var(--f-middle)"></i>Middle finger</span>
			<span><i style="background: var(--f-index)"></i>Index finger</span>
			<span><i style="background: var(--f-thumb)"></i>Thumb</span>
		</figcaption>
	</figure>

	<h2>Finger mapping</h2>
	<p>Many experienced typists depart from the standard technique. The <a href="/map">finger map</a> records your actual technique:</p>
	<ul>
		<li>You type short prompts selected to cover the keys that have not yet been mapped.</li>
		<li>
			After each keystroke, you indicate the finger you used by selecting it, or by pressing <kbd>1</kbd>–<kbd>5</kbd> for
			the left hand (little finger to thumb) and <kbd>6</kbd>–<kbd>0</kbd> for the right hand (thumb to little finger).
		</li>
		<li>For capital letters, sqwer detects which Shift key was pressed and asks which finger held it.</li>
		<li>A key is considered mapped after three entries. The colour becomes stronger as your entries agree.</li>
	</ul>
	<p>
		Each entry records the neighbouring keys, which allows sqwer to detect <strong>context habits</strong>: for example,
		pressing <kbd>E</kbd> with the middle finger in most cases but with the index finger immediately after <kbd>R</kbd>.
		Once enough keys are mapped, the <a href="/exams/finger-speed">finger speed assessment</a> uses your map to measure
		each finger.
	</p>
	<p class="callout">
		Because mapping pauses after every keystroke, it measures which finger you use rather than how fast you type. Speed
		is measured by the typing test.
	</p>

	<h2 id="metrics">Metric definitions</h2>
	<p>All results use the standard convention that one word equals five characters, including spaces.</p>
	<dl>
		<dt>WPM</dt>
		<dd>Speed calculated from correctly typed words only, including the spaces that follow them.</dd>
		<dt>Raw</dt>
		<dd>Speed calculated from all typed characters, including errors. A large difference between raw speed and WPM indicates that errors are reducing your speed.</dd>
		<dt>Accuracy</dt>
		<dd>The proportion of keystrokes that were correct. Errors corrected with Backspace are still counted.</dd>
		<dt>Consistency</dt>
		<dd>How evenly your speed was maintained from one second to the next. A value of 100% indicates a perfectly even rhythm.</dd>
		<dt>Characters</dt>
		<dd>Correct, incorrect, extra (typed beyond the end of a word) and missed (omitted when space was pressed early).</dd>
	</dl>

	<h2>Your data</h2>
	<p>
		You can begin without an account: your settings, results and finger map are then stored only in your browser. An
		account, required for the Courses after the first lesson, also stores them in a database in the European Union so
		that they are available on every device. You can download your data or delete your account at any time. The
		<a href="/privacy">Privacy Policy</a> and <a href="/cookies">Cookie and Storage Policy</a> provide full details.
	</p>
</Prose>

<style>
	.zones {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin: 8px 0;
	}
	figcaption {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
		font-size: 14px;
	}
	figcaption span {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	figcaption i {
		width: 11px;
		height: 11px;
		border-radius: 3px;
	}
</style>
