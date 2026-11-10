/* Bench candidates, all run through sherpa-onnx-node (prebuilt for macOS, Linux and Windows). */

import { readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { BENCH_DIR, modelDir } from './models.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sherpa: any = createRequire(import.meta.url)('sherpa-onnx-node');

export const THREADS = 4;
/** Speed for the slow clip. */
export const SLOW = 0.75;

export type Voice = { id: string; sid?: number; accent: 'us' | 'gb' };
type Tts = { generate(o: object): { samples: Float32Array; sampleRate: number }; sampleRate: number };

export type Engine = {
	id: string;
	label: string;
	licence: string;
	/** Model folders it reads, for the size column. */
	files: string[];
	model(): object;
	voices: Voice[];
	/** Phonemes from espeak-ng (phonemizer), raw or cleaned the way Kokoro expects; text otherwise. */
	ipa?: 'espeak' | 'kokoro';
	text?(word: string): string;
	generate?(tts: Tts, text: string, voice: Voice, speed: number): { samples: Float32Array };
};

const f = (archive: string, file: string) => path.join(modelDir(archive), file);

const kokoro = (archive: string, label: string): Engine => ({
	id: archive.includes('int8') ? 'kokoro-int8' : 'kokoro',
	label,
	ipa: archive.includes('int8') ? 'kokoro' : undefined,
	licence: 'Apache-2.0',
	files: [modelDir(archive)],
	model: () => ({
		kokoro: {
			model: f(archive, archive.includes('int8') ? 'model.int8.onnx' : 'model.onnx'),
			voices: f(archive, 'voices.bin'),
			tokens: f(archive, 'tokens.txt'),
			lexicon: f(archive, 'lexicon-us-en.txt')
		}
	}),
	// int8 is today's voice: the baseline only
	voices: archive.includes('int8')
		? [{ id: 'af_heart', sid: 3, accent: 'us' }]
		: [
				{ id: 'af_heart', sid: 3, accent: 'us' },
				{ id: 'af_bella', sid: 2, accent: 'us' },
				{ id: 'am_michael', sid: 16, accent: 'us' },
				{ id: 'bf_emma', sid: 21, accent: 'gb' }
			]
});

const kitten = (archive: string, id: string, model: string): Engine => ({
	id,
	label: `Kitten TTS 0.8 ${id.split('-')[1]}`,
	ipa: 'espeak',
	licence: 'Apache-2.0',
	files: [modelDir(archive)],
	model: () => ({
		kitten: {
			model: f(archive, model),
			voices: f(archive, 'voices.bin'),
			tokens: f(archive, 'tokens.txt')
		}
	}),
	// one voice per size; the others only if a size comes close
	voices: [{ id: 'f2', sid: 1, accent: 'us' }]
});

const piper = (voice: string, accent: 'us' | 'gb', licence: string, sid = 0): Engine => {
	const archive = `vits-piper-${voice}`;
	return {
		id: `piper-${voice}`,
		label: 'Piper',
		ipa: 'espeak',
		licence: 'GPL-3.0 runtime; voice: see model card',
		files: [modelDir(archive)],
		model: () => ({
			vits: {
				model: f(archive, `${voice}.onnx`),
				tokens: f(archive, 'tokens.txt')
			}
		}),
		voices: [{ id: voice.split('-')[1]!, sid, accent }]
	};
};

const pocket = (archive: string, id: string): Engine => {
	const q = id.endsWith('int8') ? '.int8' : '';
	let ref: { samples: Float32Array; sampleRate: number } | undefined;
	return {
		id,
		label: `Kyutai Pocket TTS${id.endsWith('int8') ? ' int8' : ''}`,
		licence: 'CC-BY-4.0',
		files: [modelDir(archive)],
		model: () => ({
			pocket: {
				lmFlow: f(archive, `lm_flow${q}.onnx`),
				lmMain: f(archive, `lm_main${q}.onnx`),
				encoder: f(archive, 'encoder.onnx'),
				decoder: f(archive, `decoder${q}.onnx`),
				textConditioner: f(archive, 'text_conditioner.onnx'),
				vocabJson: f(archive, 'vocab.json'),
				tokenScoresJson: f(archive, 'token_scores.json')
			}
		}),
		voices: [{ id: 'bria', accent: 'us' }],
		generate: (tts, text, voice, speed) => {
			ref ??= sherpa.readWave(f(archive, `test_wavs/${voice.id}.wav`));
			return tts.generate({
				text,
				generationConfig: new sherpa.GenerationConfig({ speed, referenceAudio: ref!.samples, referenceSampleRate: ref!.sampleRate })
			});
		}
	};
};

const SUPERTONIC = 'sherpa-onnx-supertonic-3-tts-int8-2026-05-11';
const MELO = 'vits-melo-tts-en';

// Out by licence: Piper en_US lessac (Blizzard 2013, research only) and ryan (CC BY-NC-SA 4.0).
export const ENGINES: Engine[] = [
	kokoro('kokoro-multi-lang-v1_0', 'Kokoro 1.0'),
	kokoro('kokoro-int8-multi-lang-v1_0', 'Kokoro 1.0 int8 (current)'),
	{
		id: 'melo',
		label: 'MeloTTS English',
		licence: 'MIT',
		files: [modelDir(MELO)],
		model: () => ({ vits: { model: f(MELO, 'model.onnx'), lexicon: f(MELO, 'lexicon.txt'), tokens: f(MELO, 'tokens.txt') } }),
		voices: [{ id: 'en-us', sid: 0, accent: 'us' }]
	},
	kitten('kitten-nano-en-v0_8-int8', 'kitten-nano', 'model.int8.onnx'),
	kitten('kitten-micro-en-v0_8', 'kitten-micro', 'model.onnx'),
	kitten('kitten-mini-en-v0_8', 'kitten-mini', 'model.onnx'),
	piper('en_US-libritts_r-medium', 'us', 'CC BY 4.0'),
	piper('en_GB-cori-high', 'gb', 'public domain'),
	piper('en_GB-alba-medium', 'gb', 'CC BY 4.0'),
	{
		id: 'supertonic',
		label: 'Supertonic 3 int8',
		licence: 'MIT code; OpenRAIL-M model',
		files: [modelDir(SUPERTONIC)],
		model: () => ({
			supertonic: {
				durationPredictor: f(SUPERTONIC, 'duration_predictor.int8.onnx'),
				textEncoder: f(SUPERTONIC, 'text_encoder.int8.onnx'),
				vectorEstimator: f(SUPERTONIC, 'vector_estimator.int8.onnx'),
				vocoder: f(SUPERTONIC, 'vocoder.int8.onnx'),
				ttsJson: f(SUPERTONIC, 'tts.json'),
				unicodeIndexer: f(SUPERTONIC, 'unicode_indexer.bin'),
				voiceStyle: f(SUPERTONIC, 'voice.bin')
			}
		}),
		voices: [
			{ id: 'style0', sid: 0, accent: 'us' },
			{ id: 'style5', sid: 5, accent: 'us' }
		]
	},
	pocket('sherpa-onnx-pocket-tts-2026-01-26', 'pocket'),
	pocket('sherpa-onnx-pocket-tts-int8-2026-01-26', 'pocket-int8')
];

/** Punctuation is passed through as it is; only the words in between are phonemized (as lib/server/voice.ts). */
const PUNCT = /(\s*[;:,.!?¡¿—…"«»“”(){}[\]]+\s*)+/g;

export async function phonemes(text: string, kind: 'espeak' | 'kokoro'): Promise<string> {
	const { phonemize } = await import('phonemizer');
	let out = '';
	let last = 0;
	for (const m of text.matchAll(PUNCT)) {
		if (m.index > last) out += (await phonemize(text.slice(last, m.index), 'en-us')).join(' ');
		out += m[0];
		last = m.index + m[0].length;
	}
	if (last < text.length) out += (await phonemize(text.slice(last), 'en-us')).join(' ');
	if (kind === 'espeak') return out.trim();
	return out
		.replace(/ʲ/g, 'j')
		.replace(/r/g, 'ɹ')
		.replace(/x/g, 'k')
		.replace(/ɬ/g, 'l')
		.replace(/ z(?=[;:,.!?¡¿—…"«»“” ]|$)/g, 'z')
		.replace(/(?<=nˈaɪn)ti(?!ː)/g, 'di')
		.trim();
}

const WHISPER = 'sherpa-onnx-whisper-small.en';
export const whisper = () => ({
	whisper: { encoder: f(WHISPER, 'small.en-encoder.onnx'), decoder: f(WHISPER, 'small.en-decoder.onnx'), language: 'en', task: 'transcribe' },
	tokens: f(WHISPER, 'small.en-tokens.txt'),
	numThreads: THREADS
});

export const clipFile = (engine: string, voice: string, speed: 'normal' | 'slow', word: string) =>
	path.join(BENCH_DIR, 'clips', engine, voice, speed, `${word}.wav`);

export function dirSize(paths: string[]): number {
	return paths.reduce((sum, p) => {
		const s = statSync(p);
		if (!s.isDirectory()) return sum + s.size;
		return sum + dirSize(readdirSync(p).map((n) => path.join(p, n)));
	}, 0);
}
