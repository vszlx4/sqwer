/* Messages between the page and the Kokoro worker. */

export const MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';
/** American English voice, matching the en-US source locale. */
export const VOICE = 'af_heart';
/** Where transformers.js keeps the model in Cache Storage, keyed by its Hugging Face URL. */
export const CACHE_NAME = 'transformers-cache';
export const MODEL_KEY = `https://huggingface.co/${MODEL}/resolve/main/onnx/model_quantized.onnx`;
/** Download size of the q8 model, for the prompt. */
export const MODEL_MB = 92;

export type ToWorker = { type: 'load' } | { type: 'speak'; id: number; text: string; speed: number };

export type FromWorker =
	| { type: 'progress'; loaded: number; total: number }
	| { type: 'ready' }
	| { type: 'audio'; id: number; samples: Float32Array; rate: number }
	| { type: 'error'; id?: number; message: string };
