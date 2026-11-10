/*
 * Renders the word set with one engine, in its own process so memory is its own. `node render.ts <engine>`
 * Writes every clip (normal and slow), then the timings to results/render-<engine>.json.
 */

import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { BENCH_DIR } from './models.ts';
import { ENGINES, SLOW, THREADS, clipFile, dirSize, phonemes, sherpa, type Engine, type Voice } from './engines.ts';
import { WORDS } from './words.ts';

const id = process.argv[2];
const engine = ENGINES.find((e) => e.id === id);
if (!engine) throw new Error(`unknown engine ${id}; one of ${ENGINES.map((e) => e.id).join(', ')}`);

const baseRss = process.memoryUsage.rss();
const loadStart = performance.now();
const tts = new sherpa.OfflineTts({ model: engine.model(), numThreads: THREADS, maxNumSentences: 1 });
const loadMs = performance.now() - loadStart;

async function say(voice: Voice, word: string, speed: number): Promise<Float32Array> {
	const e = engine!;
	const text = e.text?.(word) ?? `${word}.`;
	if (e.generate) return e.generate(tts, text, voice, speed).samples;
	if (!e.ipa) return tts.generate({ text, sid: voice.sid ?? 0, speed }).samples;
	const ipa = await phonemes(text, e.ipa);
	const phonemeCodepoints = [[...ipa].map((c) => c.codePointAt(0)!)];
	return tts.generate({ text, generationConfig: new sherpa.GenerationConfig({ sid: voice.sid ?? 0, speed, phonemeCodepoints }) }).samples;
}

const hash = (s: Float32Array) => createHash('sha256').update(new Uint8Array(s.buffer, s.byteOffset, s.byteLength)).digest('hex');

type VoiceResult = { voice: string; msPerWord: number; p95: number; secondsPerWord: number; deterministic: number };
const voices: VoiceResult[] = [];

for (const voice of engine.voices) {
	await say(voice, 'hello', 1); // warm-up
	const times: number[] = [];
	let audio = 0;
	let same = 0;
	let checked = 0;
	for (const [i, word] of WORDS.entries()) {
		const t = performance.now();
		const normal = await say(voice, word, 1);
		times.push(performance.now() - t);
		audio += normal.length / tts.sampleRate;
		const slow = await say(voice, word, SLOW);
		// every tenth word is rendered again to check the output repeats
		if (i % 10 === 0) {
			checked++;
			if (hash(await say(voice, word, 1)) === hash(normal)) same++;
		}
		for (const [speed, samples] of [['normal', normal], ['slow', slow]] as const) {
			const file = clipFile(engine.id, voice.id, speed, word);
			mkdirSync(path.dirname(file), { recursive: true });
			sherpa.writeWave(file, { samples, sampleRate: tts.sampleRate });
		}
	}
	times.sort((a, b) => a - b);
	voices.push({
		voice: voice.id,
		msPerWord: times.reduce((a, b) => a + b, 0) / times.length,
		p95: times[Math.floor(times.length * 0.95)],
		secondsPerWord: audio / WORDS.length,
		deterministic: same / checked
	});
	console.log(`${engine.id}/${voice.id}: ${voices.at(-1)!.msPerWord.toFixed(0)} ms/word`);
}

const result = {
	engine: engine.id,
	sampleRate: tts.sampleRate,
	loadMs,
	memoryMb: (process.resourceUsage().maxRSS * 1024 - baseRss) / 2 ** 20,
	modelMb: dirSize(engine.files) / 2 ** 20,
	voices
};
mkdirSync(path.join(BENCH_DIR, 'results'), { recursive: true });
writeFileSync(path.join(BENCH_DIR, 'results', `render-${engine.id}.json`), JSON.stringify(result, null, '\t'));

export type RenderResult = typeof result;
export type { Engine };
