// Voice for Listen and type: Standard (Kokoro, made per word, the default) or Supertonic (made ahead of time).
//
//   npm run voice -- status                   which voice, generator mode, clips made
//   npm run voice -- use standard|supertonic  pick the voice; Supertonic downloads its model first
//   npm run voice -- pause | resume           stop or restart making clips (stays paused across restarts)
//   npm run voice -- mode low|active          low: one thread, lowest priority; active: all cores but one
//   npm run voice:sync [-- --all]             make missing clips now (lessons, English 200/1k, themed; --all: every list)
//
// install, dev and build run `sync --check`: one status line, nothing made. While Supertonic is chosen and not paused,
// the running site makes the rest in the background. SQWER_VOICE=skip keeps Standard; SQWER_VOICE=pause holds clips.
import { availableParallelism, setPriority } from 'node:os';
import { DATA_DIR } from '../src/lib/server/config.ts';
import { countMade, readState, runGenerator } from '../src/lib/server/voice/generator.ts';
import { supertonicMaker, threadsFor } from '../src/lib/server/voice/make.ts';
import { buildManifest, findListsDir } from '../src/lib/server/voice/manifest.ts';
import { activeVoice, readSettings, shouldGenerate, voiceDir, voiceEnv, writeSettings } from '../src/lib/server/voice/settings.ts';
import { SUPERTONIC_MODEL, ensureModel, hasModel } from '../src/lib/server/voice/supertonic.ts';

const VOICE_DIR = voiceDir(DATA_DIR);
const CORE = new Set(['course', 'english-200', 'english-1k', 'double-letters', 'contractions', 'shakespearean', 'misspelled', 'legal', 'medical', 'old-english']);
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

async function download() {
	if (hasModel(VOICE_DIR)) return;
	console.log(`Downloading the Supertonic model (${mb(SUPERTONIC_MODEL.bytes)}) …`);
	let shown = 0;
	await ensureModel(VOICE_DIR, (got, total) => {
		const pct = Math.floor((100 * got) / total);
		if (pct >= shown + 10) console.log(`  ${(shown = pct)}%`);
	});
	console.log('Model ready.');
}

async function make(sets: ReturnType<typeof buildManifest>, background: boolean) {
	const settings = readSettings(DATA_DIR);
	if (background && settings.mode === 'low') {
		try {
			setPriority(19);
		} catch {
			// Not allowed on this system; one thread still keeps it light.
		}
	}
	await download();
	const threads = background ? threadsFor(settings.mode) : Math.max(1, availableParallelism() - 1);
	const maker = await supertonicMaker(VOICE_DIR, threads);
	let last = 0;
	const result = await runGenerator({
		voiceDir: VOICE_DIR,
		sets,
		make: maker,
		keepGoing: () => shouldGenerate(readSettings(DATA_DIR)) || (!background && activeVoice(readSettings(DATA_DIR)) === 'supertonic'),
		onProgress: (s) => {
			if (background || Date.now() - last < 2000) return;
			last = Date.now();
			const left = s.msPerClip ? ((s.total - s.made) * s.msPerClip) / 60000 : null;
			console.log(`  ${n(s.made)} of ${n(s.total)} clips${left === null ? '' : `, about ${Math.ceil(left)} min left`} · ${s.word ?? ''}`);
		}
	});
	if (result === 'locked') console.log('Another generator is already making clips (the running site, or another sync).');
	else if (!background) console.log(result === 'done' ? 'All clips made.' : 'Stopped.');
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
	case 'sync': {
		const s = readSettings(DATA_DIR);
		// Hooks (install, dev, build): a status line at most, never an error.
		if (flag('--check')) {
			try {
				if (activeVoice(s) === 'supertonic' && !flag('--quiet')) console.log(`Voice: Supertonic, ${progressLine()}.${s.paused ? ' Paused.' : ''}`);
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
		await make(flag('--all') ? sets : sets.filter((x) => CORE.has(x.id)), false);
		break;
	}
	case 'run': {
		// Started by the site; stops when the voice is switched back or paused.
		if (shouldGenerate(readSettings(DATA_DIR))) await make(buildManifest(findListsDir()), true);
		break;
	}
	default:
		console.error('Usage: npm run voice -- status | use standard|supertonic | pause | resume | mode low|active | sync [--all]');
		process.exit(2);
}
