/* Kokoro text to speech, off the main thread. Model files come from /voice/ (lib/server/voice.ts), never a third party. */

import { env } from '@huggingface/transformers';
import { KokoroTTS } from 'kokoro-js';
import ortMjs from 'onnxruntime-web-dist/ort-wasm-simd-threaded.jsep.mjs?url';
import ortWasm from 'onnxruntime-web-dist/ort-wasm-simd-threaded.jsep.wasm?url';
import { MODEL, VOICE, type FromWorker, type ToWorker } from './protocol.ts';

const HF = /^https:\/\/huggingface\.co\/onnx-community\/Kokoro-82M-v1\.0-ONNX\/resolve\/[^/]+\//;
const ownFetch = globalThis.fetch.bind(globalThis);
// kokoro-js hardcodes the voice URL; every Hugging Face URL of the model maps onto our proxy.
globalThis.fetch = (input, init) => {
	const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
	return ownFetch(HF.test(url) ? url.replace(HF, `${self.location.origin}/voice/`) : input, init);
};

env.allowLocalModels = false;
const wasm = env.backends.onnx.wasm!;
wasm.wasmPaths = { mjs: ortMjs, wasm: ortWasm };
// No cross-origin isolation, so no shared memory for threads.
wasm.numThreads = 1;

let tts: Promise<KokoroTTS> | null = null;
const post = (m: FromWorker, transfer: Transferable[] = []) => self.postMessage(m, { transfer });

function load(): Promise<KokoroTTS> {
	tts ??= KokoroTTS.from_pretrained(MODEL, {
		dtype: 'q8',
		device: 'wasm',
		progress_callback: (p: { status: string; file?: string; loaded?: number; total?: number }) => {
			if (p.status === 'progress' && p.file?.endsWith('.onnx') && p.total) post({ type: 'progress', loaded: p.loaded ?? 0, total: p.total });
		}
	});
	return tts;
}

/** Cuts leading and trailing silence, keeping a short pad so onsets and endings stay soft. */
function trim(samples: Float32Array, rate: number): Float32Array {
	const floor = 0.01;
	const pad = Math.round(rate * 0.04);
	let start = 0;
	let end = samples.length - 1;
	while (start < end && Math.abs(samples[start]) < floor) start++;
	while (end > start && Math.abs(samples[end]) < floor) end--;
	return samples.slice(Math.max(0, start - pad), Math.min(samples.length, end + pad));
}

/** One synthesis at a time, in request order: the first word of a list is ready first. */
let queue: Promise<void> = Promise.resolve();

async function handle(m: ToWorker) {
	try {
		if (m.type === 'load') {
			await load();
			post({ type: 'ready' });
		} else if (m.type === 'speak') {
			const audio = await (await load()).generate(m.text, { voice: VOICE, speed: m.speed });
			const samples = trim(audio.audio, audio.sampling_rate);
			post({ type: 'audio', id: m.id, samples, rate: audio.sampling_rate }, [samples.buffer]);
		}
	} catch (err) {
		if (m.type === 'load') tts = null;
		post({ type: 'error', id: m.type === 'speak' ? m.id : undefined, message: err instanceof Error ? err.message : String(err) });
	}
}

self.onmessage = (e: MessageEvent<ToWorker>) => {
	queue = queue.then(() => handle(e.data));
};
