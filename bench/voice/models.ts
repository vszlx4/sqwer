/* Model archives for the voice bench, from the sherpa-onnx releases, pinned by SHA-256. */

import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
export const BENCH_DIR = process.env.VOICE_BENCH_DIR ?? path.join(ROOT, '.data', 'voice-bench');
export const MODELS_DIR = path.join(BENCH_DIR, 'models');

export type Archive = { name: string; release: 'tts-models' | 'asr-models'; sha256: string };

const tts = (name: string, sha256: string): Archive => ({ name, release: 'tts-models', sha256 });

export const ARCHIVES: Archive[] = [
	tts('kokoro-multi-lang-v1_0', '60703707bc05ccd48d60e1eb723f38b07d6e474795a0b6a588d7220400e0f7a4'),
	tts('kokoro-int8-multi-lang-v1_0', '72c347230107ef8a31098ec4d468a605244beef5f1ed00db97efa13518800653'),
	tts('vits-melo-tts-en', 'f87bc5752ea3ec34273a2cc0c5086854c18b6b89dfd0534b5248e86a14cedb5d'),
	tts('kitten-nano-en-v0_8-int8', '6fa5be852612ce761094ba74ee6123b4fc4acfefa79bf64dc63acae4a83af2fd'),
	tts('kitten-micro-en-v0_8', '85faaea7511ca9d1d2f251fed0a4553bdf0d1ee046102fa60ddd8046c751f76f'),
	tts('kitten-mini-en-v0_8', '518f9b130320f690d5b5476df77bde4215fca67773cda16710318e5081234b9d'),
	tts('vits-piper-en_US-lessac-medium', '9e3febfacf0abf4270172d2958bcec246032b7e88efc2720840cc80c93de334e'),
	tts('vits-piper-en_US-ryan-high', '6a71edf4d308b9cb2eaeadc8d1f3c6bf96120ecb7fe52c29a2b6e139c59760ed'),
	tts('vits-piper-en_US-libritts_r-medium', '10dc268f3e371696d721486123e2705a9fc1faa113491979fde4d88dba1f1b1c'),
	tts('vits-piper-en_GB-cori-high', '42922f07738fcde2e49eed4e959635692f73b933de35a6b7c1010162ff566292'),
	tts('vits-piper-en_GB-alba-medium', 'fcd45962906933eec4431d3688f7d74aaac8713c87c6717f91fd3b23463aa1a1'),
	tts('sherpa-onnx-supertonic-3-tts-int8-2026-05-11', '82fa96f91c4ef8abaae3a14a3f4153facf88bed821d1f7331cec2700f432c427'),
	tts('sherpa-onnx-pocket-tts-2026-01-26', '61422a478ef09d9b2c067261fb822e11786e0c86842c76d8633b7069968be7b5'),
	tts('sherpa-onnx-pocket-tts-int8-2026-01-26', '2f3b88823cbbb9bf0b2477ec8ae7b3fec417b3a87b6bb5f256dba66f2ad967cb'),
	{ name: 'sherpa-onnx-whisper-small.en', release: 'asr-models', sha256: '0cdba2b8aaab69e04847f3427cc9709574112e67913a1a84b7fec3a8729faa9a' }
];

export const modelDir = (name: string) => path.join(MODELS_DIR, name);
