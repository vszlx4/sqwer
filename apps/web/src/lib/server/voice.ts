/*
 * Spoken words for Listen and type, rendered on our server with Kokoro-82M (ONNX) and kept on disk, so the browser
 * downloads one small clip per word and never contacts a third party. The model is pulled once from a pinned
 * Hugging Face revision and checked against its SHA-256.
 */

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { InferenceSession } from 'onnxruntime-node';
import { CLIP_VERSION, isSpeakable } from '#lib/voice/clip.ts';
import { DATA_DIR } from './config.ts';
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

/** Downloads a model file unless it is there, checking its SHA-256. */
async function ensureFile(file: string): Promise<void> {
	const target = modelFile(file);
	if (existsSync(target)) return;
	const res = await fetch(`https://huggingface.co/${VOICE_REPO}/resolve/${VOICE_REVISION}/${file}`);
	if (!res.ok) throw new Error(`voice: ${file} answered ${res.status}`);
	const body = Buffer.from(await res.arrayBuffer());
	if (createHash('sha256').update(body).digest('hex') !== MODEL_FILES[file]) throw new Error(`voice: ${file} failed its checksum`);
	await mkdir(path.dirname(target), { recursive: true });
	await writeAtomic(target, body);
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

interface Model {
	session: InferenceSession;
	ort: typeof import('onnxruntime-node');
	vocab: Map<string, number>;
	/** 510 style rows of 256, picked by token count. */
	voice: Float32Array;
}

let model: Promise<Model> | null = null;

function load(): Promise<Model> {
	model ??= (async () => {
		for (const file of Object.keys(MODEL_FILES)) await ensureFile(file);
		const ort = await import('onnxruntime-node');
		const tokenizer = JSON.parse(await readFile(modelFile('tokenizer.json'), 'utf8')) as { model: { vocab: Record<string, number> } };
		const raw = await readFile(modelFile(`voices/${VOICE}.bin`));
		return {
			ort,
			session: await ort.InferenceSession.create(modelFile('onnx/model_quantized.onnx')),
			vocab: new Map(Object.entries(tokenizer.model.vocab)),
			voice: new Float32Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength))
		};
	})().catch((e: unknown) => {
		model = null;
		throw e;
	});
	return model;
}

/** Kokoro speech for a line of text, as 24 kHz samples. */
async function speak(text: string, speed: number): Promise<Float32Array> {
	const { ort, session, vocab, voice } = await load();
	const ids = [...(await phonemes(text))].flatMap((c) => vocab.get(c) ?? []).slice(0, 510);
	const row = Math.min(ids.length, 509) * 256;
	const { waveform } = await session.run({
		input_ids: new ort.Tensor('int64', BigInt64Array.from([0, ...ids, 0], BigInt), [1, ids.length + 2]),
		style: new ort.Tensor('float32', voice.slice(row, row + 256), [1, 256]),
		speed: new ort.Tensor('float32', [speed], [1])
	});
	return waveform!.data as Float32Array;
}

/** One render at a time; a word asked for twice is rendered once. */
let queue: Promise<unknown> = Promise.resolve();
const pending = new Map<string, Promise<Buffer>>();

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
export async function clip(word: string, speed: StandardSpeed = 'normal'): Promise<Buffer> {
	if (!isSpeakable(word)) throw new Error('voice: not a word');
	const file = clipFile(word, speed);
	if (existsSync(file)) return readFile(file);
	const key = `${speed}:${word}`;
	let job = pending.get(key);
	if (!job) {
		job = (queue = queue.catch(() => {}).then(() => render(word, speed)))
			.then(async (wav) => {
				await mkdir(path.dirname(file), { recursive: true });
				await writeAtomic(file, wav as Buffer);
				return wav as Buffer;
			})
			.finally(() => pending.delete(key));
		pending.set(key, job);
	}
	return job;
}
