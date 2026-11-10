/*
 * Voice engine bench for Listen and type (#171). `node run.ts [--rerender] [--slow] [engine...]`
 * Renders the word set with each engine not rendered yet (one process each), has Whisper read the normal clips back
 * (and the slow ones with --slow), marks them with matchHeard, and writes results.md and results.json.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { matchHeard } from '../../packages/content/src/heard.ts';
import { ENGINES, SLOW, THREADS, clipFile, sherpa, whisper } from './engines.ts';
import { BENCH_DIR } from './models.ts';
import type { RenderResult } from './render.ts';
import { GROUPS, WORDS } from './words.ts';

const rerender = process.argv.includes('--rerender');
const scoreSlow = process.argv.includes('--slow');
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const engines = only.length ? ENGINES.filter((e) => only.includes(e.id)) : ENGINES;
const results = path.join(BENCH_DIR, 'results');

for (const e of engines) {
	if (!rerender && existsSync(path.join(results, `render-${e.id}.json`))) continue;
	console.log(`render ${e.id}`);
	execFileSync(process.execPath, [path.join(import.meta.dirname, 'render.ts'), e.id], { stdio: 'inherit' });
}

const asr = new sherpa.OfflineRecognizer({ modelConfig: whisper(), decodingMethod: 'greedy_search' });
const PAD = 0.5;

/** What Whisper hears in a clip, as one lowercase word. */
function hear(file: string): string {
	const wave = sherpa.readWave(file);
	const pad = new Float32Array(Math.round(wave.sampleRate * PAD));
	const samples = new Float32Array(pad.length * 2 + wave.samples.length);
	samples.set(wave.samples, pad.length);
	const stream = asr.createStream();
	stream.acceptWaveform({ samples, sampleRate: wave.sampleRate });
	asr.decode(stream);
	return asr
		.getResult(stream)
		.text.toLowerCase()
		.replace(/[^a-z'\- ]/g, '')
		.trim();
}

type Row = {
	engine: string;
	voice: string;
	normal: number;
	slow: number;
	groups: Record<string, number>;
	missed: string[];
} & Omit<RenderResult['voices'][number], 'voice'> & Omit<RenderResult, 'voices' | 'engine'>;

const rows: Row[] = [];
for (const e of engines) {
	const render: RenderResult = JSON.parse(readFileSync(path.join(results, `render-${e.id}.json`), 'utf8'));
	for (const v of render.voices) {
		const ok = { normal: 0, slow: 0 };
		const groups: Record<string, number> = {};
		const missed: string[] = [];
		for (const word of WORDS) {
			for (const speed of scoreSlow ? (['normal', 'slow'] as const) : (['normal'] as const)) {
				const heard = hear(clipFile(e.id, v.voice, speed, word));
				if (matchHeard(word, heard).ok) ok[speed]++;
				else if (speed === 'normal') missed.push(`${word}→${heard || '∅'}`);
			}
		}
		for (const [g, ws] of Object.entries(GROUPS))
			groups[g] = ws.filter((w) => !missed.some((m) => m.startsWith(`${w}→`))).length / ws.length;
		const { voices: _, engine: __, ...shared } = render;
		rows.push({ engine: e.id, ...shared, ...v, normal: ok.normal / WORDS.length, slow: scoreSlow ? ok.slow / WORDS.length : NaN, groups, missed });
		console.log(`score ${e.id}/${v.voice}: ${ok.normal}/${WORDS.length} normal, ${ok.slow} slow`);
	}
}

const pct = (n: number) => `${Math.round(n * 100)}`;
const md = [
	`# Voice bench`,
	'',
	`${WORDS.length} words, one process per engine, ${THREADS} threads, slow = speed ${SLOW}. Score: Whisper small.en reads the clip back, matchHeard marks it.`,
	'',
	'| Engine | Voice | Licence | Score | Slow | ms/word | p95 | Load ms | Memory MB | Model MB | Same output | Rate |',
	'| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
	...rows.map((r) => {
		const e = engines.find((x) => x.id === r.engine)!;
		return `| ${e.label} | ${r.voice} | ${e.licence} | ${pct(r.normal)} | ${Number.isNaN(r.slow) ? '–' : pct(r.slow)} | ${r.msPerWord.toFixed(0)} | ${r.p95.toFixed(0)} | ${r.loadMs.toFixed(0)} | ${r.memoryMb.toFixed(0)} | ${r.modelMb.toFixed(0)} | ${pct(r.deterministic)} | ${r.sampleRate} |`;
	}),
	'',
	'## Missed at normal speed',
	'',
	...rows.map((r) => `- ${r.engine}/${r.voice}: ${r.missed.join(', ') || 'none'}`)
].join('\n');

writeFileSync(path.join(results, 'results.json'), JSON.stringify(rows, null, '\t'));
writeFileSync(path.join(results, 'results.md'), `${md}\n`);
console.log(`\n${md}`);
