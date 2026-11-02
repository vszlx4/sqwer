/*
 * Kokoro voice model, served from our own origin so the browser never contacts a third party. Files are pulled
 * once from a pinned Hugging Face revision, checked against their SHA-256 and kept in DATA_DIR.
 */

import { createHash } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { DATA_DIR } from './config.ts';

export const VOICE_REPO = 'onnx-community/Kokoro-82M-v1.0-ONNX';
export const VOICE_REVISION = '1939ad2a8e416c0acfeecc08a694d14ef25f2231';

/** The only files served: path → SHA-256 and type at the pinned revision. */
export const VOICE_FILES: Record<string, { sha256: string; type: string }> = {
	'config.json': { sha256: 'df34b4f930b23447cd4dc410fabfb42eb3f24e803e6c3f97d618fb359380a36f', type: 'application/json' },
	'tokenizer.json': { sha256: '77a02c8e164413299b4b4c403b14f8e0e1c1b727db4d46a09d6327b861060a34', type: 'application/json' },
	'tokenizer_config.json': { sha256: 'be1cb066d6ef6b074b3f15e6a6dd21ac88ff3cdaedf325f0aaed686c70f75d20', type: 'application/json' },
	'onnx/model_quantized.onnx': { sha256: 'fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478', type: 'application/octet-stream' },
	'voices/af_heart.bin': { sha256: 'd583ccff3cdca2f7fae535cb998ac07e9fcb90f09737b9a41fa2734ec44a8f0b', type: 'application/octet-stream' }
};

const DIR = path.join(DATA_DIR, 'voice', VOICE_REVISION);
const pending = new Map<string, Promise<string>>();

/** Downloads one file into DIR unless it is there; concurrent callers share the download. */
async function ensure(file: string): Promise<string> {
	const target = path.join(DIR, file);
	if (existsSync(target)) return target;
	let job = pending.get(file);
	if (!job) {
		job = (async () => {
			const res = await fetch(`https://huggingface.co/${VOICE_REPO}/resolve/${VOICE_REVISION}/${file}`);
			if (!res.ok) throw new Error(`voice: ${file} answered ${res.status}`);
			const body = Buffer.from(await res.arrayBuffer());
			const digest = createHash('sha256').update(body).digest('hex');
			if (digest !== VOICE_FILES[file].sha256) throw new Error(`voice: ${file} failed its checksum`);
			await mkdir(path.dirname(target), { recursive: true });
			const tmp = `${target}.${process.pid}.part`;
			await writeFile(tmp, body);
			await rename(tmp, target).catch(async (e) => {
				await rm(tmp, { force: true });
				throw e;
			});
			return target;
		})().finally(() => pending.delete(file));
		pending.set(file, job);
	}
	return job;
}

/** Response for a model file, or null when the path is not one of VOICE_FILES. */
export async function voiceFile(file: string, method: 'GET' | 'HEAD'): Promise<Response | null> {
	const meta = Object.hasOwn(VOICE_FILES, file) ? VOICE_FILES[file] : null;
	if (!meta) return null;
	const target = await ensure(file);
	const { size } = await stat(target);
	const headers = {
		'Content-Type': meta.type,
		'Content-Length': String(size),
		// Pinned revision: the bytes behind a path never change.
		'Cache-Control': 'public, max-age=31536000, immutable',
		'Content-Security-Policy': "default-src 'none'; sandbox"
	};
	if (method === 'HEAD') return new Response(null, { headers });
	return new Response(Readable.toWeb(createReadStream(target)) as ReadableStream, { headers });
}
