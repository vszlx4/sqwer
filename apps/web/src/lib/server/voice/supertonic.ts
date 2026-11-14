/*
 * Supertonic 3 on onnxruntime-node: the voice picked by the engine bench and vote (style 5, int8 model as packaged
 * by sherpa-onnx).
 * Pipeline as in Supertone's MIT Node example: duration, text encoder, a few flow-matching steps from noise, vocoder.
 * The noise is the only random part; it comes from a seeded generator, so a word with a seed renders the same clip.
 * The model is not in the repository (OpenRAIL licence, use restrictions); it is downloaded on first use from a pinned
 * release and checked against its SHA-256.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { InferenceSession, Tensor } from 'onnxruntime-node';

export const SUPERTONIC_MODEL = {
	name: 'sherpa-onnx-supertonic-3-tts-int8-2026-05-11',
	url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/sherpa-onnx-supertonic-3-tts-int8-2026-05-11.tar.bz2',
	sha256: '82fa96f91c4ef8abaae3a14a3f4153facf88bed821d1f7331cec2700f432c427',
	/** Download size in bytes, shown before someone picks the voice. */
	bytes: 128_774_318
} as const;

const FILES = [
	'duration_predictor.int8.onnx',
	'text_encoder.int8.onnx',
	'vector_estimator.int8.onnx',
	'vocoder.int8.onnx',
	'tts.json',
	'unicode_indexer.bin',
	'voice.bin',
	'LICENSE'
] as const;

/** Voice style picked in the vote (row of voice.bin). */
export const STYLE = 5;
/** Flow-matching steps (sherpa-onnx's default, as voted). */
export const STEPS = 5;
const MIN_DURATION = 0.1;

export const modelDir = (voiceDir: string) => path.join(voiceDir, 'models', SUPERTONIC_MODEL.name);
export const hasModel = (voiceDir: string) => FILES.every((f) => existsSync(path.join(modelDir(voiceDir), f)));

/** Regular files of a tar archive, by base name. */
export function untar(tar: Uint8Array): Map<string, Uint8Array> {
	const files = new Map<string, Uint8Array>();
	const text = (from: number, len: number) => new TextDecoder().decode(tar.subarray(from, from + len)).replace(/\0.*$/s, '');
	for (let at = 0; at + 512 <= tar.length; ) {
		const name = text(at, 100);
		if (!name) break;
		const size = parseInt(text(at + 124, 12).trim() || '0', 8);
		const type = String.fromCharCode(tar[at + 156]!);
		const prefix = text(at + 345, 155);
		if (type === '0' || type === '\0') files.set(path.posix.basename(prefix ? `${prefix}/${name}` : name), tar.slice(at + 512, at + 512 + size));
		at += 512 + Math.ceil(size / 512) * 512;
	}
	return files;
}

/** Downloads and unpacks the model unless it is there. Reports bytes received. */
export async function ensureModel(voiceDir: string, onProgress?: (received: number, total: number) => void): Promise<void> {
	if (hasModel(voiceDir)) return;
	const res = await fetch(SUPERTONIC_MODEL.url);
	if (!res.ok || !res.body) throw new Error(`voice: the Supertonic model download answered ${res.status}`);
	const chunks: Uint8Array[] = [];
	const hash = createHash('sha256');
	let received = 0;
	for await (const chunk of res.body as AsyncIterable<Uint8Array>) {
		chunks.push(chunk);
		hash.update(chunk);
		received += chunk.length;
		onProgress?.(received, SUPERTONIC_MODEL.bytes);
	}
	if (hash.digest('hex') !== SUPERTONIC_MODEL.sha256) throw new Error('voice: the Supertonic model failed its checksum');
	const { default: bzip } = await import('seek-bzip');
	const files = untar(new Uint8Array(bzip.decode(Buffer.concat(chunks))));
	const dir = modelDir(voiceDir);
	const tmp = `${dir}.${process.pid}.part`;
	await rm(tmp, { recursive: true, force: true });
	await mkdir(tmp, { recursive: true });
	for (const f of FILES) {
		const body = files.get(f);
		if (!body) throw new Error(`voice: ${f} is missing from the Supertonic model`);
		await writeFile(path.join(tmp, f), body);
	}
	await rm(dir, { recursive: true, force: true });
	await rename(tmp, dir);
}

/** Uniform numbers from a 32-bit seed (mulberry32): the same sequence on every machine. */
export function uniform(seed: number): () => number {
	let s = seed >>> 0;
	return () => {
		s = (s + 0x6d2b79f5) >>> 0;
		let t = s;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Standard normal noise (Box-Muller), seeded. */
export function gaussian(seed: number, n: number): Float32Array {
	const next = uniform(seed);
	const out = new Float32Array(n);
	for (let i = 0; i < n; i += 2) {
		const r = Math.sqrt(-2 * Math.log(Math.max(1e-10, next())));
		const a = 2 * Math.PI * next();
		out[i] = r * Math.cos(a);
		if (i + 1 < n) out[i + 1] = r * Math.sin(a);
	}
	return out;
}

/** One voice style row of voice.bin: header of six int64 dims (ttl, dp), then all ttl floats, then all dp floats. */
export function readStyle(bin: Uint8Array, row: number) {
	const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
	const dims = Array.from({ length: 6 }, (_, i) => Number(view.getBigInt64(i * 8, true)));
	const [rows, t1, t2, rowsDp, d1, d2] = dims as [number, number, number, number, number, number];
	if (rows !== rowsDp || row < 0 || row >= rows) throw new Error(`voice: no style ${row} in voice.bin`);
	const floats = (offset: number, count: number) => {
		const out = new Float32Array(count);
		for (let i = 0; i < count; i++) out[i] = view.getFloat32(offset + i * 4, true);
		return out;
	};
	const ttlStart = 48;
	const dpStart = ttlStart + rows * t1 * t2 * 4;
	return {
		ttl: { data: floats(ttlStart + row * t1 * t2 * 4, t1 * t2), dims: [1, t1, t2] },
		dp: { data: floats(dpStart + row * d1 * d2 * 4, d1 * d2), dims: [1, d1, d2] }
	};
}

/** Text as the model reads it: NFKD, ends in punctuation, language tags. */
export function prepareText(text: string): string {
	let t = text.normalize('NFKD').replace(/\s+/g, ' ').trim();
	if (!/[.!?;:,'")\]}…]$/.test(t)) t += '.';
	return `<en>${t}</en>`;
}

export interface Supertonic {
	sampleRate: number;
	/** Mono samples for a line of text at a speed (1 normal, below 1 slower). */
	speak(text: string, speed: number, seed: number): Promise<Float32Array>;
}

/** Loads the model from disk with a given number of threads. */
export async function loadSupertonic(voiceDir: string, threads: number): Promise<Supertonic> {
	const ort = await import('onnxruntime-node');
	const dir = modelDir(voiceDir);
	const opts: InferenceSession.SessionOptions = {
		intraOpNumThreads: threads,
		interOpNumThreads: 1,
		executionMode: 'sequential',
		graphOptimizationLevel: 'all'
	};
	const session = (f: string) => ort.InferenceSession.create(path.join(dir, f), opts);
	const [dp, enc, est, voc] = await Promise.all(FILES.slice(0, 4).map(session)) as [InferenceSession, InferenceSession, InferenceSession, InferenceSession];
	const cfg = JSON.parse(readFileSync(path.join(dir, 'tts.json'), 'utf8')) as {
		ae: { sample_rate: number; base_chunk_size: number };
		ttl: { chunk_compress_factor: number; latent_dim: number };
	};
	const ib = readFileSync(path.join(dir, 'unicode_indexer.bin'));
	const indexer = new Int32Array(ib.buffer.slice(ib.byteOffset, ib.byteOffset + ib.byteLength));
	const style = readStyle(new Uint8Array(readFileSync(path.join(dir, 'voice.bin'))), STYLE);
	const rate = cfg.ae.sample_rate;
	const chunk = cfg.ae.base_chunk_size * cfg.ttl.chunk_compress_factor;
	const latentDim = cfg.ttl.latent_dim * cfg.ttl.chunk_compress_factor;
	const f32 = (data: Float32Array, dims: number[]) => new ort.Tensor('float32', data, dims);
	const styleTtl = f32(style.ttl.data, style.ttl.dims);
	const styleDp = f32(style.dp.data, style.dp.dims);

	return {
		sampleRate: rate,
		async speak(text, speed, seed) {
			const codes = Array.from(prepareText(text), (c) => c.codePointAt(0)!);
			const ids = BigInt64Array.from(codes, (c) => BigInt(c < indexer.length ? Math.max(0, indexer[c]!) : 0));
			const textIds = new ort.Tensor('int64', ids, [1, ids.length]);
			const textMask = f32(new Float32Array(ids.length).fill(1), [1, 1, ids.length]);
			const { duration } = await dp.run({ text_ids: textIds, style_dp: styleDp, text_mask: textMask });
			const seconds = Math.max(MIN_DURATION, (duration as Tensor).data[0] as number / speed);
			const { text_emb } = await enc.run({ text_ids: textIds, style_ttl: styleTtl, text_mask: textMask });
			const wavLen = Math.max(1, Math.floor(seconds * rate));
			const len = Math.ceil(wavLen / chunk);
			const latentMask = f32(new Float32Array(len).fill(1), [1, 1, len]);
			let latent = gaussian(seed, latentDim * len);
			const total = f32(new Float32Array([STEPS]), [1]);
			for (let step = 0; step < STEPS; step++) {
				const out = await est.run({
					noisy_latent: f32(latent, [1, latentDim, len]),
					text_emb: text_emb!,
					style_ttl: styleTtl,
					text_mask: textMask,
					latent_mask: latentMask,
					total_step: total,
					current_step: f32(new Float32Array([step]), [1])
				});
				latent = Float32Array.from(out.denoised_latent!.data as Float32Array);
			}
			const { wav_tts } = await voc.run({ latent: f32(latent, [1, latentDim, len]) });
			const wav = wav_tts!.data as Float32Array;
			return wav.slice(0, Math.min(wavLen, wav.length));
		}
	};
}

/** Writes a file through a temporary name, so a crash never leaves half a file. */
export async function writeAtomic(file: string, body: Uint8Array): Promise<void> {
	await mkdir(path.dirname(file), { recursive: true });
	const tmp = `${file}.${process.pid}.part`;
	await writeFile(tmp, body);
	await rename(tmp, file).catch(async (e) => {
		await rm(tmp, { force: true });
		throw e;
	});
}
