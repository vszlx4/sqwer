/*
 * Spoken words for Listen and type, rendered on our server with Kokoro-82M and kept on disk, so the browser
 * downloads one small clip per word and never contacts a third party. The model is pulled once from a pinned
 * Hugging Face revision and checked against its SHA-256.
 */

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { KokoroTTS } from 'kokoro-js';
import { CLIP_VERSION, isSpeakable } from '#lib/courses/voice/clip.ts';
import { DATA_DIR } from './config.ts';
import { afterCarrier, toWav, trimSilence } from './voice-audio.ts';

export const VOICE_REPO = 'onnx-community/Kokoro-82M-v1.0-ONNX';
export const VOICE_REVISION = '1939ad2a8e416c0acfeecc08a694d14ef25f2231';

/** Model files at the pinned revision → SHA-256. Voices ship with kokoro-js. */
const MODEL_FILES: Record<string, string> = {
	'config.json': 'df34b4f930b23447cd4dc410fabfb42eb3f24e803e6c3f97d618fb359380a36f',
	'tokenizer.json': '77a02c8e164413299b4b4c403b14f8e0e1c1b727db4d46a09d6327b861060a34',
	'tokenizer_config.json': 'be1cb066d6ef6b074b3f15e6a6dd21ac88ff3cdaedf325f0aaed686c70f75d20',
	'onnx/model_quantized.onnx': 'fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478'
};

/** American English voice, matching the en-US source locale. */
const VOICE = 'af_heart';
const SPEED = 0.9;
/** Said before the word and cut away; see voice-audio.ts. */
const CARRIER = 'Okay... ';

const MODELS = path.join(DATA_DIR, 'voice', 'models', VOICE_REVISION);
const CLIPS = path.join(DATA_DIR, 'voice', 'clips', String(CLIP_VERSION));

/** Downloads a model file unless it is there, checking its SHA-256. */
async function ensureFile(file: string): Promise<void> {
	const target = path.join(MODELS, VOICE_REPO, file);
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

let model: Promise<KokoroTTS> | null = null;

function load(): Promise<KokoroTTS> {
	model ??= (async () => {
		for (const file of Object.keys(MODEL_FILES)) await ensureFile(file);
		const { env } = await import('@huggingface/transformers');
		const { KokoroTTS } = await import('kokoro-js');
		// Our verified copy only; nothing is fetched at load time.
		env.allowRemoteModels = false;
		env.localModelPath = `${MODELS}/`;
		return KokoroTTS.from_pretrained(VOICE_REPO, { dtype: 'q8', device: 'cpu' });
	})().catch((e: unknown) => {
		model = null;
		throw e;
	});
	return model;
}

/** One render at a time; a word asked for twice is rendered once. */
let queue: Promise<unknown> = Promise.resolve();
const pending = new Map<string, Promise<Buffer>>();

async function render(word: string): Promise<Buffer> {
	const tts = await load();
	const audio = await tts.generate(`${CARRIER}${word}.`, { voice: VOICE, speed: SPEED });
	const cut = afterCarrier(audio.audio);
	if (!cut) throw new Error(`voice: no pause after the carrier for "${word}"`);
	return toWav(trimSilence(cut, audio.sampling_rate), audio.sampling_rate);
}

/** Whether a clip for this word is already on disk. */
export function hasClip(word: string): boolean {
	return existsSync(path.join(CLIPS, `${word}.wav`));
}

/** WAV clip of a word, rendered on first request. Throws for words that are not speakable. */
export async function clip(word: string): Promise<Buffer> {
	if (!isSpeakable(word)) throw new Error('voice: not a word');
	const file = path.join(CLIPS, `${word}.wav`);
	if (existsSync(file)) return readFile(file);
	let job = pending.get(word);
	if (!job) {
		job = (queue = queue.catch(() => {}).then(() => render(word)))
			.then(async (wav) => {
				await mkdir(CLIPS, { recursive: true });
				await writeAtomic(file, wav as Buffer);
				return wav as Buffer;
			})
			.finally(() => pending.delete(word));
		pending.set(word, job);
	}
	return job;
}
