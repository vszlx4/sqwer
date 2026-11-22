// Voice for Listen and type: Standard (Kokoro, made per word, the default) or Enhanced (Supertonic, made ahead of time).
// The settings keep the id `supertonic` for Enhanced; `use enhanced` and `use supertonic` both pick it.
//
//   npm run voice -- status                   which voice, generator mode, words ready per chosen set
//   npm run voice -- use standard|enhanced    pick the voice; Enhanced downloads its model first
//   npm run voice -- pause | resume           stop or restart making clips (stays paused across restarts)
//   npm run voice -- mode low|active          low: gentle (efficiency cores on a Mac); active: about five times faster
//   npm run voice -- add|remove <set>         choose the sets to make (course or a list id); add puts it last
//   npm run voice -- next <set>               make a set before the others (added when not chosen yet)
//   npm run voice -- battery on|off           keep making clips on battery power (off: wait for the charger)
//   npm run voice -- limit <GB>|off           most disk the clips may take (1, 2, 5, 10 or 20 GB)
//   npm run voice:sync                        make the chosen sets now, as in active mode
//   npm run voice -- check [<set>]            health check: remove broken clips (made again) and, for all, unused ones
//
// install, dev and build run `sync --check`: one status line, nothing made. While Enhanced is chosen and not paused,
// the running site makes the chosen sets in the background, then stops. SQWER_VOICE=skip keeps Standard;
// SQWER_VOICE=pause holds clips.
import { setPriority } from 'node:os';
import { DATA_DIR } from '../src/lib/server/config.ts';
import { SPEEDS, fingerprint, type Speed } from '../src/lib/server/voice/clips.ts';
import { countReady, isLocked, listClips, readState, runGenerator, runKey, sweepUnwanted, writeState, type ClipMaker, type GeneratorState } from '../src/lib/server/voice/generator.ts';
import { checkClips } from '../src/lib/server/voice/health.ts';
import { restFor, supertonicMaker, threadsFor } from '../src/lib/server/voice/make.ts';
import { buildManifest, chosenSets, findListsDir, isKnownSet, loadCatalog } from '../src/lib/server/voice/manifest.ts';
import { onBattery } from '../src/lib/server/voice/power.ts';
import { DISK_LIMITS, activeVoice, maxClips, readSettings, shouldGenerate, voiceDir, voiceEnv, writeSettings, type DiskLimit, type VoiceSettings } from '../src/lib/server/voice/settings.ts';
import { SUPERTONIC_MODEL, ensureModel, hasModel } from '../src/lib/server/voice/supertonic.ts';

const VOICE_DIR = voiceDir(DATA_DIR);
const [command = 'status', ...args] = process.argv.slice(2);
const flag = (f: string) => args.includes(f);
const n = (x: number) => x.toLocaleString('en-US');
const mb = (b: number) => `${Math.round(b / 1e6)} MB`;
const NAME = { standard: 'Standard', supertonic: 'Enhanced' } as const;

function progressLines(): string[] {
	const sets = chosenSets(loadCatalog(), readSettings(DATA_DIR).sets);
	return countReady(sets, listClips(VOICE_DIR)).map((p) => `  ${p.name}: ${n(p.ready)} of ${n(p.words)} words ready`);
}

async function download(background = false) {
	if (hasModel(VOICE_DIR)) return;
	if (!background) console.log(`Downloading the Enhanced voice model (${mb(SUPERTONIC_MODEL.bytes)}) …`);
	// The screens show the download from state.json.
	const prev = readState(VOICE_DIR);
	const state: GeneratorState = { ...(prev ?? { ready: 0, words: 0, left: 0, sets: [], msPerClip: null }), running: true, word: null, making: null, error: null, complete: false, updatedAt: '' };
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

/** Every clip any set may want: what a run keeps on disk. */
function wantedClips(): Set<string> {
	const wanted = new Set<string>();
	for (const set of buildManifest(findListsDir())) for (const w of set.words) for (const sp of Object.keys(SPEEDS) as Speed[]) wanted.add(fingerprint(w, sp));
	return wanted;
}

/**
 * Makes the chosen sets. In the background (the site's child) a change of voice, pause, mode, sets, battery or disk
 * limit stops the run and the site starts the next one; low mode rests between clips and waits on battery. In the
 * foreground (voice:sync) as in active mode.
 */
async function make(background: boolean): Promise<'done' | 'stopped' | 'locked' | 'full' | 'skipped'> {
	if (isLocked(VOICE_DIR)) {
		if (!background) console.log('Another generator is already making clips (the running site, or another sync).');
		return 'skipped';
	}
	const settings = readSettings(DATA_DIR);
	const low = background && settings.mode === 'low';
	if (low) {
		try {
			setPriority(19);
		} catch {
			// Not allowed on this system; one thread and the rests still keep it light.
		}
	}
	// Clips of an older format or of words no list has any more: gone before counting.
	const removed = await sweepUnwanted(VOICE_DIR, (fp) => wanted.has(fp), listClips(VOICE_DIR)).catch(() => 0);
	if (removed && !background) console.log(`Removed ${n(removed)} clips no set uses.`);
	const threads = threadsFor(background ? settings.mode : 'active');
	// The model loads on the first missing clip: a run with nothing to make never loads it.
	let maker: ClipMaker | null = null;
	const clip: ClipMaker = async (word, speed, fp) => {
		if (!maker) {
			await download(background);
			maker = await supertonicMaker(VOICE_DIR, threads);
		}
		return maker(word, speed, fp);
	};
	let last = 0;
	const same = (s: VoiceSettings) =>
		s.mode === settings.mode && s.diskLimit === settings.diskLimit && s.battery === settings.battery && runKey(s.sets) === runKey(settings.sets);
	const result = await runGenerator({
		voiceDir: VOICE_DIR,
		sets: chosenSets(loadCatalog(), settings.sets),
		make: clip,
		key: runKey(settings.sets),
		rest: background ? restFor(settings.mode) : 0,
		maxClips: maxClips(settings),
		keepGoing: async () => {
			const s = readSettings(DATA_DIR);
			if (!background) return activeVoice(s) === 'supertonic' ? 'go' : 'stop';
			if (!shouldGenerate(s) || !same(s)) return 'stop';
			return !s.battery && (await onBattery()) ? 'battery' : 'go';
		},
		onProgress: (s) => {
			if (background || Date.now() - last < 2000) return;
			last = Date.now();
			const left = s.msPerClip ? (s.left * s.msPerClip) / 60000 : null;
			console.log(`  ${n(s.ready)} of ${n(s.words)} words${left === null ? '' : `, about ${Math.ceil(left)} min left`} · ${s.word ?? ''}`);
		}
	});
	if (result === 'locked') console.log('Another generator is already making clips (the running site, or another sync).');
	else if (!background) console.log(result === 'done' ? 'Every chosen set is ready.' : result === 'full' ? `Stopped at the disk limit (${settings.diskLimit} GB).` : 'Stopped.');
	return result;
}

let wanted = new Set<string>();

/** A set id from the command line, or an exit with the choices. */
function setArg(usage: string): string {
	const id = args[0] ?? '';
	const all = loadCatalog();
	if (!isKnownSet(id, all)) {
		console.error(`Usage: npm run voice -- ${usage} <set>   (${all.map((s) => s.id).join(', ')})`);
		process.exit(2);
	}
	return id;
}

switch (command) {
	case 'status': {
		const s = readSettings(DATA_DIR);
		console.log(`Voice: ${NAME[activeVoice(s)]}${voiceEnv() ? ` (SQWER_VOICE=${voiceEnv()})` : ''}`);
		if (s.voice === 'supertonic') {
			console.log(`Generator: ${s.paused ? 'paused' : 'on'}, ${s.mode} mode${s.battery ? ', also on battery' : ''}. Model ${hasModel(VOICE_DIR) ? 'downloaded' : 'not downloaded yet'}.`);
			for (const line of progressLines()) console.log(line);
			const st = readState(VOICE_DIR);
			if (st?.running) console.log(st.waiting === 'battery' ? 'Waiting for the charger.' : `Making clips now${st.msPerClip ? `, ${(st.msPerClip / 1000).toFixed(1)} s a clip` : ''}.`);
			if (st?.error) console.log(`Last error: ${st.error}`);
		}
		break;
	}
	case 'use': {
		const voice = args[0] === 'enhanced' ? 'supertonic' : args[0];
		if (voice !== 'standard' && voice !== 'supertonic') {
			console.error('Usage: npm run voice -- use standard|enhanced');
			process.exit(2);
		}
		if (voice === 'supertonic') {
			console.log(`Enhanced: a ${mb(SUPERTONIC_MODEL.bytes)} download, then clips made ahead of time (about 2 KB each).`);
			await download();
			await writeSettings(DATA_DIR, { voice, paused: false });
			console.log('Voice set to Enhanced. The running site makes clips in the background; `npm run voice:sync` makes them now.');
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
	case 'add':
	case 'remove':
	case 'next': {
		const id = setArg(command);
		const sets = readSettings(DATA_DIR).sets.filter((x) => x !== id);
		const next = command === 'remove' ? sets : command === 'next' ? [id, ...sets] : [...sets, id];
		await writeSettings(DATA_DIR, { sets: next });
		console.log(`Sets to make, in order: ${chosenSets(loadCatalog(), next).map((x) => x.name).join(', ') || 'none'}.`);
		break;
	}
	case 'battery': {
		if (args[0] !== 'on' && args[0] !== 'off') {
			console.error('Usage: npm run voice -- battery on|off');
			process.exit(2);
		}
		await writeSettings(DATA_DIR, { battery: args[0] === 'on' });
		console.log(args[0] === 'on' ? 'Clips are made on battery too.' : 'On battery, clips wait for the charger.');
		break;
	}
	case 'sync': {
		const s = readSettings(DATA_DIR);
		// Hooks (install, dev, build): a status line at most, never an error.
		if (flag('--check')) {
			try {
				// The generator's last saved count: no recount, so dev and build start at once.
				const st = readState(VOICE_DIR);
				const line = st ? `${n(st.ready ?? 0)} of ${n(st.words ?? 0)} words ready` : 'no clips made yet';
				if (activeVoice(s) === 'supertonic' && !flag('--quiet')) console.log(`Voice: Enhanced, ${line}.${s.paused ? ' Paused.' : ''}`);
			} catch (e) {
				console.log(`Voice: status unavailable (${e instanceof Error ? e.message : e}).`);
			}
			break;
		}
		if (activeVoice(s) !== 'supertonic') {
			console.log('Voice: Standard; nothing to make. `npm run voice -- use enhanced` switches to the voice made ahead of time.');
			break;
		}
		wanted = wantedClips();
		await make(false);
		break;
	}
	case 'check': {
		const manifest = buildManifest(findListsDir());
		const only = args[0] ? loadCatalog().find((x) => x.id === setArg('check')) : undefined;
		const r = await checkClips(VOICE_DIR, manifest, only);
		console.log(`Checked ${n(r.checked)} clips${only ? ` in ${only.name}` : ''}.`);
		console.log(`  Removed: ${n(r.empty)} empty, ${n(r.bad)} broken, ${n(r.length)} with an odd length, ${n(r.orphans)} no longer used, ${n(r.parts)} leftover temporary files.`);
		if (r.removed) console.log('Broken clips are made again by the generator.');
		break;
	}
	case 'run': {
		// Started by the site; stops when the voice is switched back, paused, or given other settings.
		if (!shouldGenerate(readSettings(DATA_DIR))) break;
		wanted = wantedClips();
		await make(true);
		break;
	}
	default:
		console.error('Usage: npm run voice -- status | use standard|enhanced | pause | resume | mode low|active | add|remove|next <set> | battery on|off | limit <GB>|off | check [<set>] | sync');
		process.exit(2);
}
