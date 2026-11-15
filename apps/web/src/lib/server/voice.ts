/*
 * Spoken words for Listen and type, rendered on our server with Kokoro-82M (ONNX) and kept on disk, so the browser
 * downloads one small clip per word and never contacts a third party. The model is pulled once from a pinned
 * Hugging Face revision and checked against its SHA-256.
 * onnxruntime-node's run() holds the thread it is called on for the whole render, so the model runs in a worker
 * thread: requests (pages, made clips) are answered while a word renders.
 */

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { availableParallelism } from 'node:os';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import { CLIP_VERSION, isSpeakable, type Need } from '#lib/voice/clip.ts';
import { DATA_DIR } from './config.ts';
import { NeedQueue } from './voice/queue.ts';
import { afterCarrier, toWav, trimSilence } from './voice-audio.ts';

export const VOICE_REPO = 'onnx-community/Kokoro-82M-v1.0-ONNX';
export const VOICE_REVISION = '1939ad2a8e416c0acfeecc08a694d14ef25f2231';

/** American English voice, matching the en-US source locale. */
const VOICE = 'af_heart';

/** Model files at the pinned revision → SHA-256. */
const MODEL_FILES: Record<string, string> = {
	'tokenizer.json': '77a02c8e164413299b4b4c403b14f8e0e1c1b727db4d46a09d6327b861060a34',
	'onnx/model_quantized.onnx': 'fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478',
	[`voices/${VOICE}.bin`]: 'd583ccff3cdca2f7fae535cb998ac07e9fcb90f09737b9a41fa2734ec44a8f0b'
};
/** Kokoro speed per clip speed: Slow is its own render, not a time-stretch. */
export const STANDARD_SPEEDS = { normal: 0.9, slow: 0.68 } as const;
export type StandardSpeed = keyof typeof STANDARD_SPEEDS;
const RATE = 24000;
/** Said before the word and cut away; see voice-audio.ts. */
const CARRIER = 'Okay... ';

const MODELS = path.join(DATA_DIR, 'voice', 'models', VOICE_REVISION);
const CLIPS = path.join(DATA_DIR, 'voice', 'clips', String(CLIP_VERSION));
const modelFile = (file: string) => path.join(MODELS, VOICE_REPO, file);

/** A download that receives nothing for this long is dropped; the next request tries again. */
const DOWNLOAD_STALL_MS = 30_000;
/** A render that takes longer than this is given up and the worker restarted (a word takes well under a second). */
export const RENDER_TIMEOUT_MS = 30_000;
/** More threads than this do not make one short word faster; they only take cores from everything else. */
export const kokoroThreads = (cores = availableParallelism()) => Math.min(4, Math.max(1, cores));

/** Downloads a model file unless it is there, checking its SHA-256. */
async function ensureFile(file: string): Promise<void> {
	const target = modelFile(file);
	if (existsSync(target)) return;
	const abort = new AbortController();
	let stall = setTimeout(() => abort.abort(), DOWNLOAD_STALL_MS);
	try {
		const res = await fetch(`https://huggingface.co/${VOICE_REPO}/resolve/${VOICE_REVISION}/${file}`, { signal: abort.signal });
		if (!res.ok || !res.body) throw new Error(`voice: ${file} answered ${res.status}`);
		const chunks: Uint8Array[] = [];
		for await (const chunk of res.body as AsyncIterable<Uint8Array>) {
			chunks.push(chunk);
			clearTimeout(stall);
			stall = setTimeout(() => abort.abort(), DOWNLOAD_STALL_MS);
		}
		const body = Buffer.concat(chunks);
		if (createHash('sha256').update(body).digest('hex') !== MODEL_FILES[file]) throw new Error(`voice: ${file} failed its checksum`);
		await mkdir(path.dirname(target), { recursive: true });
		await writeAtomic(target, body);
	} catch (e) {
		throw abort.signal.aborted ? new Error(`voice: the ${file} download stalled`) : e;
	} finally {
		clearTimeout(stall);
	}
}

async function writeAtomic(target: string, body: Buffer) {
	const tmp = `${target}.${process.pid}.part`;
	await writeFile(tmp, body);
	await rename(tmp, target).catch(async (e) => {
		await rm(tmp, { force: true });
		throw e;
	});
}

/** Punctuation is passed through as it is; only the words in between are phonemized. */
const PUNCT = /(\s*[;:,.!?¡¿—…"«»“”(){}[\]]+\s*)+/g;

/** espeak-ng IPA, cleaned up the way kokoro-js does for en-us. */
async function phonemes(text: string): Promise<string> {
	const { phonemize } = await import('phonemizer');
	let out = '';
	let last = 0;
	for (const m of text.matchAll(PUNCT)) {
		if (m.index > last) out += (await phonemize(text.slice(last, m.index), 'en-us')).join(' ');
		out += m[0];
		last = m.index + m[0].length;
	}
	if (last < text.length) out += (await phonemize(text.slice(last), 'en-us')).join(' ');
	return out
		.replace(/ʲ/g, 'j')
		.replace(/r/g, 'ɹ')
		.replace(/x/g, 'k')
		.replace(/ɬ/g, 'l')
		.replace(/ z(?=[;:,.!?¡¿—…"«»“” ]|$)/g, 'z')
		.replace(/(?<=nˈaɪn)ti(?!ː)/g, 'di')
		.trim();
}

/* The worker: loads the model, then answers each { id, ids, style, speed } with { id, samples } or { id, error }. CommonJS, run with eval. */
const WORKER = `
const { parentPort, workerData } = require('node:worker_threads');
const ort = require(workerData.ort);
ort.InferenceSession.create(workerData.model, { intraOpNumThreads: workerData.threads, interOpNumThreads: 1 }).then(
	(session) => {
		parentPort.on('message', async ({ id, ids, style, speed }) => {
			try {
				const { waveform } = await session.run({
					input_ids: new ort.Tensor('int64', BigInt64Array.from(ids, BigInt), [1, ids.length]),
					style: new ort.Tensor('float32', style, [1, 256]),
					speed: new ort.Tensor('float32', [speed], [1])
				});
				const samples = Float32Array.from(waveform.data);
				parentPort.postMessage({ id, samples }, [samples.buffer]);
			} catch (e) {
				parentPort.postMessage({ id, error: String((e && e.message) || e) });
			}
		});
		parentPort.postMessage({ ready: true });
	},
	(e) => parentPort.postMessage({ ready: false, error: String((e && e.message) || e) })
);
`;

type Reply = { id: number; samples?: Float32Array; error?: string } | { ready: boolean; error?: string };

interface Model {
	worker: Worker;
	vocab: Map<string, number>;
	/** 510 style rows of 256, picked by token count. */
	voice: Float32Array;
	waiting: Map<number, { resolve: (s: Float32Array) => void; reject: (e: Error) => void }>;
}

let model: Promise<Model> | null = null;
/** The loaded model behind `model`. */
let current: Model | null = null;
let ids = 0;

/** Stops a worker and fails its words; the next word starts a new one. */
function drop(m: Model, why: string) {
	if (current === m) (current = null), (model = null);
	for (const w of m.waiting.values()) w.reject(new Error(why));
	m.waiting.clear();
	void m.worker.terminate();
}

function load(): Promise<Model> {
	model ??= (async () => {
		for (const file of Object.keys(MODEL_FILES)) await ensureFile(file);
		const tokenizer = JSON.parse(await readFile(modelFile('tokenizer.json'), 'utf8')) as { model: { vocab: Record<string, number> } };
		const raw = await readFile(modelFile(`voices/${VOICE}.bin`));
		const worker = new Worker(WORKER, {
			eval: true,
			workerData: { ort: createRequire(import.meta.url).resolve('onnxruntime-node'), model: modelFile('onnx/model_quantized.onnx'), threads: kokoroThreads() }
		});
		const m: Model = {
			worker,
			vocab: new Map(Object.entries(tokenizer.model.vocab)),
			voice: new Float32Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength)),
			waiting: new Map()
		};
		await new Promise<void>((resolve, reject) => {
			worker.on('message', (r: Reply) => {
				if ('ready' in r) return r.ready ? resolve() : reject(new Error(`voice: ${r.error}`));
				const w = m.waiting.get(r.id);
				m.waiting.delete(r.id);
				if (r.samples) w?.resolve(r.samples);
				else w?.reject(new Error(`voice: ${r.error}`));
			});
			worker.on('error', (e: Error) => {
				reject(e);
				drop(m, `voice: ${e.message}`);
			});
			worker.on('exit', () => {
				reject(new Error('voice: the model stopped'));
				drop(m, 'voice: the model stopped');
			});
		});
		worker.unref();
		current = m;
		return m;
	})().catch((e: unknown) => {
		model = null;
		throw e;
	});
	return model;
}

/** Loads the model ahead of the first word, so that word does not wait for it. The first download waits for a word. */
export function warmVoice(): void {
	if (model || !Object.keys(MODEL_FILES).every((f) => existsSync(modelFile(f)))) return;
	load().catch((e: unknown) => console.error(JSON.stringify({ kind: 'voice', error: e instanceof Error ? e.message : String(e) })));
}

/** Kokoro speech for a line of text, as 24 kHz samples. */
async function speak(text: string, speed: number): Promise<Float32Array> {
	const m = await load();
	const tokens = [...(await phonemes(text))].flatMap((c) => m.vocab.get(c) ?? []).slice(0, 510);
	const row = Math.min(tokens.length, 509) * 256;
	const id = ++ids;
	return new Promise<Float32Array>((resolve, reject) => {
		const timer = setTimeout(() => drop(m, 'voice: the render timed out'), RENDER_TIMEOUT_MS);
		m.waiting.set(id, {
			resolve: (s) => (clearTimeout(timer), resolve(s)),
			reject: (e) => (clearTimeout(timer), reject(e))
		});
		m.worker.postMessage({ id, ids: [0, ...tokens, 0], style: m.voice.slice(row, row + 256), speed });
	});
}

/** Renders one word at a time, the word in play first; a word asked for twice is rendered once. */
const queue = new NeedQueue<Buffer>((busy) => busyListeners.forEach((f) => f(busy)));
const busyListeners = new Set<(busy: boolean) => void>();

/** Told when rendering starts after a quiet spell and when it is done, so background work can make room. */
export function onRendering(listener: (busy: boolean) => void): () => void {
	busyListeners.add(listener);
	return () => busyListeners.delete(listener);
}

async function render(word: string, speed: StandardSpeed): Promise<Buffer> {
	const cut = afterCarrier(await speak(`${CARRIER}${word}.`, STANDARD_SPEEDS[speed]));
	if (!cut) throw new Error(`voice: no pause after the carrier for "${word}"`);
	return toWav(trimSilence(cut, RATE), RATE);
}

/** Normal clips stay where they always were; slow ones sit beside them in slow/. */
const clipFile = (word: string, speed: StandardSpeed) => path.join(CLIPS, ...(speed === 'slow' ? ['slow'] : []), `${word}.wav`);

/** Whether a clip for this word is already on disk. */
export function hasClip(word: string, speed: StandardSpeed = 'normal'): boolean {
	return existsSync(clipFile(word, speed));
}

/** WAV clip of a word, rendered on first request. Throws for words that are not speakable. */
export async function clip(word: string, speed: StandardSpeed = 'normal', need: Need = 'soon'): Promise<Buffer> {
	if (!isSpeakable(word)) throw new Error('voice: not a word');
	const file = clipFile(word, speed);
	if (existsSync(file)) return readFile(file);
	return queue.run(`${speed}:${word}`, need, async () => {
		const wav = await render(word, speed);
		await mkdir(path.dirname(file), { recursive: true });
		await writeAtomic(file, wav);
		return wav;
	});
}
