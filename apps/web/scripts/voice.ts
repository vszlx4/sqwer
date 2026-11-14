// Voice for Listen and type: Standard (Kokoro, made per word, the default) or Supertonic (made ahead of time).
//
//   npm run voice -- status                   which voice, generator mode, clips made
//   npm run voice -- use standard|supertonic  pick the voice; Supertonic downloads its model first
//   npm run voice -- pause | resume           stop or restart making clips (stays paused across restarts)
//   npm run voice -- mode low|active          low: one thread, lowest priority; active: all cores but one
//   npm run voice -- limit <GB>|off           most disk the clips may take (1, 2, 5, 10 or 20 GB)
//   npm run voice:sync [-- --all]             make missing clips now (lessons, English 200/1k, themed; --all: every list)
//   npm run voice -- first <set>              make one set (course or a list id) before the rest, in active mode
//   npm run voice -- check [<set>]            health check: remove broken clips (made again) and, for all, orphans
//
// install, dev and build run `sync --check`: one status line, nothing made. While Supertonic is chosen and not paused,
// the running site makes the rest in the background. SQWER_VOICE=skip keeps Standard; SQWER_VOICE=pause holds clips.
import { availableParallelism, setPriority } from 'node:os';
import { DATA_DIR } from '../src/lib/server/config.ts';
import { countMade, isLocked, readState, runGenerator, writeState, type GeneratorState } from '../src/lib/server/voice/generator.ts';
import { checkClips } from '../src/lib/server/voice/health.ts';
import { supertonicMaker, threadsFor } from '../src/lib/server/voice/make.ts';
import { CORE_SETS, buildManifest, findListsDir, fullSet, type VoiceSet } from '../src/lib/server/voice/manifest.ts';
import { firstId } from '../src/lib/server/voice/status.ts';
import { DISK_LIMITS, activeVoice, maxClips, readSettings, shouldGenerate, voiceDir, voiceEnv, writeSettings, type DiskLimit } from '../src/lib/server/voice/settings.ts';
import { SUPERTONIC_MODEL, ensureModel, hasModel } from '../src/lib/server/voice/supertonic.ts';

const VOICE_DIR = voiceDir(DATA_DIR);
const [command = 'status', ...args] = process.argv.slice(2);
const flag = (f: string) => args.includes(f);
const n = (x: number) => x.toLocaleString('en-US');
const mb = (b: number) => `${Math.round(b / 1e6)} MB`;

function progressLine(): string {
	const sets = buildManifest(findListsDir());
	const made = countMade(VOICE_DIR, sets);
	const total = made.reduce((a, s) => a + s.total, 0);
	const done = made.reduce((a, s) => a + s.made, 0);
	return `${n(done)} of ${n(total)} clips made (${((100 * done) / Math.max(1, total)).toFixed(1)}%)`;
}

async function download(background = false) {
	if (hasModel(VOICE_DIR)) return;
	if (!background) console.log(`Downloading the Supertonic model (${mb(SUPERTONIC_MODEL.bytes)}) …`);
	// The screens show the download from state.json.
	const prev = readState(VOICE_DIR);
	const state: GeneratorState = { ...(prev ?? { made: 0, total: 0, sets: [], msPerClip: null }), running: true, word: null, error: null, all: false, updatedAt: '' };
	const save = (received: number) => writeState(VOICE_DIR, { ...state, downloading: { received, total: SUPERTONIC_MODEL.bytes }, updatedAt: new Date().toISOString() });
	let shown = 0;
	try {
		await ensureModel(VOICE_DIR, (got, total) => {
			const pct = Math.floor((100 * got) / total);
			if (pct < shown + (background ? 2 : 10)) return;
			shown = pct;
			if (background) void save(got).catch(() => {});
			else console.log(`  ${pct}%`);
		});
	} catch (e) {
		await writeState(VOICE_DIR, { ...state, running: false, downloading: null, error: `Model download failed: ${e instanceof Error ? e.message : e}`, updatedAt: new Date().toISOString() });
		throw e;
	}
	if (!background) console.log('Model ready.');
}

interface MakeOptions {
	/** All cores but one, whatever the mode (a set made first). */
	active?: boolean;
	/** The sets are the whole manifest. */
	all?: boolean;
}

async function make(sets: readonly VoiceSet[], background: boolean, o: MakeOptions = {}): Promise<'done' | 'stopped' | 'locked' | 'full' | 'skipped'> {
	// Checked before loading the model, which takes a few seconds and a few hundred MB.
	if (isLocked(VOICE_DIR)) {
		if (!background) console.log('Another generator is already making clips (the running site, or another sync).');
		return 'skipped';
	}
	const settings = readSettings(DATA_DIR);
	if (background && settings.mode === 'low' && !o.active) {
		try {
			setPriority(19);
		} catch {
			// Not allowed on this system; one thread still keeps it light.
		}
	}
	await download(background);
	const threads = background && !o.active ? threadsFor(settings.mode) : Math.max(1, availableParallelism() - 1);
	const maker = await supertonicMaker(VOICE_DIR, threads);
	let last = 0;
	// In the background, a new mode, disk limit or set to make first stops this run; the site starts the next one.
	const same = (s: ReturnType<typeof readSettings>) => s.mode === settings.mode && s.first === settings.first && s.diskLimit === settings.diskLimit;
	const result = await runGenerator({
		voiceDir: VOICE_DIR,
		sets,
		make: maker,
		all: o.all,
		maxClips: maxClips(settings),
		keepGoing: () => {
			const s = readSettings(DATA_DIR);
			return background ? shouldGenerate(s) && same(s) : activeVoice(s) === 'supertonic';
		},
		onProgress: (s) => {
			if (background || Date.now() - last < 2000) return;
			last = Date.now();
			const left = s.msPerClip ? ((s.total - s.made) * s.msPerClip) / 60000 : null;
			console.log(`  ${n(s.made)} of ${n(s.total)} clips${left === null ? '' : `, about ${Math.ceil(left)} min left`} · ${s.word ?? ''}`);
		}
	});
	if (result === 'locked') console.log('Another generator is already making clips (the running site, or another sync).');
	else if (!background) console.log(result === 'done' ? 'All clips made.' : result === 'full' ? `Stopped at the disk limit (${settings.diskLimit} GB).` : 'Stopped.');
	return result;
}

/** A set id the screens or the command line may ask for: course or a word list. */
function setFor(id: string, manifest: readonly VoiceSet[]): VoiceSet | null {
	const set = fullSet(findListsDir(), id, manifest);
	return set && { ...set, id: firstId(set.id) };
}

switch (command) {
	case 'status': {
		const s = readSettings(DATA_DIR);
		console.log(`Voice: ${activeVoice(s)}${voiceEnv() ? ` (SQWER_VOICE=${voiceEnv()})` : ''}`);
		if (s.voice === 'supertonic') {
			console.log(`Generator: ${s.paused ? 'paused' : 'on'}, ${s.mode} mode. Model ${hasModel(VOICE_DIR) ? 'downloaded' : 'not downloaded yet'}.`);
			console.log(progressLine());
			const st = readState(VOICE_DIR);
			if (st?.running) console.log(`Making clips now${st.msPerClip ? `, ${Math.round(st.msPerClip)} ms a clip` : ''}.`);
			if (st?.error) console.log(`Last error: ${st.error}`);
		}
		break;
	}
	case 'use': {
		const voice = args[0];
		if (voice !== 'standard' && voice !== 'supertonic') {
			console.error('Usage: npm run voice -- use standard|supertonic');
			process.exit(2);
		}
		if (voice === 'supertonic') {
			console.log(`Supertonic: a ${mb(SUPERTONIC_MODEL.bytes)} download, then clips made ahead of time (about 2 KB each).`);
			await download();
			await writeSettings(DATA_DIR, { voice, paused: false });
			console.log('Voice set to Supertonic. The running site makes clips in the background; `npm run voice:sync` makes them now.');
		} else {
			await writeSettings(DATA_DIR, { voice });
			console.log('Voice set to Standard. Clips made so far are kept.');
		}
		break;
	}
	case 'pause':
	case 'resume':
		await writeSettings(DATA_DIR, { paused: command === 'pause' });
		console.log(command === 'pause' ? 'Paused: no clips are made until you resume.' : 'Resumed.');
		break;
	case 'mode': {
		const mode = args[0];
		if (mode !== 'low' && mode !== 'active') {
			console.error('Usage: npm run voice -- mode low|active');
			process.exit(2);
		}
		await writeSettings(DATA_DIR, { mode });
		console.log(`Mode: ${mode}. Takes effect when the generator next starts.`);
		break;
	}
	case 'limit': {
		const gb = args[0] === 'off' ? null : Number(args[0]);
		if (gb !== null && !DISK_LIMITS.includes(gb as DiskLimit)) {
			console.error(`Usage: npm run voice -- limit ${DISK_LIMITS.join('|')}|off`);
			process.exit(2);
		}
		await writeSettings(DATA_DIR, { diskLimit: gb as DiskLimit | null });
		console.log(gb ? `Clips may take up to ${gb} GB.` : 'No disk limit.');
		break;
	}
	case 'sync': {
		const s = readSettings(DATA_DIR);
		// Hooks (install, dev, build): a status line at most, never an error.
		if (flag('--check')) {
			try {
				// The generator's last saved count: no recount, so dev and build start at once.
				const st = readState(VOICE_DIR);
				const line = st ? `${n(st.made)} of ${n(st.total)} clips made` : 'no clips made yet';
				if (activeVoice(s) === 'supertonic' && !flag('--quiet')) console.log(`Voice: Supertonic, ${line}.${s.paused ? ' Paused.' : ''}`);
			} catch (e) {
				console.log(`Voice: status unavailable (${e instanceof Error ? e.message : e}).`);
			}
			break;
		}
		if (activeVoice(s) !== 'supertonic') {
			console.log('Voice: Standard; nothing to make. `npm run voice -- use supertonic` switches to the voice made ahead of time.');
			break;
		}
		const sets = buildManifest(findListsDir());
		await make(flag('--all') ? sets : sets.filter((x) => CORE_SETS.has(x.id)), false, { all: flag('--all') });
		break;
	}
	case 'first': {
		const set = args[0] && setFor(args[0], buildManifest(findListsDir()));
		if (!set) {
			console.error('Usage: npm run voice -- first course|<list id>   (english-200, english-1k, legal, …)');
			process.exit(2);
		}
		await writeSettings(DATA_DIR, { first: args[0]!, paused: false });
		console.log(`${set.name} is made next, in active mode, by the running site.`);
		break;
	}
	case 'check': {
		const manifest = buildManifest(findListsDir());
		const only = args[0] ? setFor(args[0], manifest) : undefined;
		if (only === null) {
			console.error('Usage: npm run voice -- check [course|<list id>]');
			process.exit(2);
		}
		const r = await checkClips(VOICE_DIR, manifest, only);
		console.log(`Checked ${n(r.checked)} clips${only ? ` in ${only.name}` : ''}.`);
		console.log(`  Removed: ${n(r.empty)} empty, ${n(r.bad)} broken, ${n(r.length)} with an odd length, ${n(r.orphans)} no longer used, ${n(r.parts)} leftover temporary files.`);
		if (r.removed) console.log('Broken clips are made again by the generator.');
		break;
	}
	case 'run': {
		// Started by the site; stops when the voice is switched back, paused, or set to another mode or first set.
		const s = readSettings(DATA_DIR);
		if (!shouldGenerate(s)) break;
		const manifest = buildManifest(findListsDir());
		const first = s.first ? setFor(s.first, manifest) : null;
		if (s.first && !first) await writeSettings(DATA_DIR, { first: null });
		if (first) {
			// Done: clear it, and the site starts the usual run a moment later.
			if ((await make([first], true, { active: true })) === 'done' && readSettings(DATA_DIR).first === s.first) await writeSettings(DATA_DIR, { first: null });
			break;
		}
		await make(manifest, true, { all: true });
		break;
	}
	default:
		console.error('Usage: npm run voice -- status | use standard|supertonic | pause | resume | mode low|active | limit <GB>|off | first <set> | check [<set>] | sync [--all]');
		process.exit(2);
}
