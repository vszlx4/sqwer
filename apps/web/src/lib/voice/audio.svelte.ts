/*
 * One audio graph for the site: the voice and Echo's tones share a context and a master gain. Browsers start audio
 * only from a click or key, so the first gesture unlocks it; when they still hold it, `sound.state` is 'blocked' and
 * the page offers a tap to turn sound on.
 */

export type SoundState = 'off' | 'on' | 'blocked' | 'unsupported';

interface Graph {
	ctx: AudioContext;
	/** Voice volume, in front of the master. */
	voice: GainNode;
	/** Tones: soft low-pass and a limiter against stacked peaks, in front of the master. */
	tones: AudioNode;
}

class Sound {
	state = $state<SoundState>(typeof AudioContext === 'undefined' ? 'unsupported' : 'off');
	#graph: Graph | null = null;

	get supported(): boolean {
		return typeof AudioContext !== 'undefined';
	}

	/** iPhone and iPad without the audio session API: the silent switch mutes web audio there. */
	get silentSwitch(): boolean {
		if (typeof navigator === 'undefined') return false;
		const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
		return ios && !('audioSession' in navigator);
	}

	/** The graph, made on first use. Null where the browser has no web audio. */
	graph(): Graph | null {
		if (!this.supported) return null;
		if (this.#graph) return this.#graph;
		const ctx = new AudioContext();
		const master = ctx.createGain();
		master.connect(ctx.destination);
		const voice = ctx.createGain();
		voice.connect(master);
		const filter = ctx.createBiquadFilter();
		filter.type = 'lowpass';
		filter.frequency.value = 2200;
		const limiter = ctx.createDynamicsCompressor();
		limiter.threshold.value = -24;
		limiter.ratio.value = 8;
		const level = ctx.createGain();
		level.gain.value = 0.6;
		filter.connect(limiter).connect(level).connect(master);
		ctx.onstatechange = () => this.#read(ctx);
		this.#graph = { ctx, voice, tones: filter };
		this.#read(ctx);
		return this.#graph;
	}

	#read(ctx: AudioContext) {
		this.state = ctx.state === 'running' ? 'on' : ctx.state === 'suspended' ? 'blocked' : 'off';
	}

	/** Starts audio from a click or key. Plays through the silent switch where the browser allows it. */
	async unlock(): Promise<boolean> {
		const g = this.graph();
		if (!g) return false;
		const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
		if (session) session.type = 'playback';
		if (g.ctx.state !== 'running') await g.ctx.resume().catch(() => {});
		this.#read(g.ctx);
		return g.ctx.state === 'running';
	}
}

export const sound = new Sound();

/** A soft, piano-like tone. */
export function tone(frequency: number, duration = 0.35, volume = 0.08) {
	const g = sound.graph();
	if (!g) return;
	if (g.ctx.state === 'suspended') void g.ctx.resume().catch(() => {});
	const { ctx, tones } = g;
	const now = ctx.currentTime;
	const osc = ctx.createOscillator();
	const overtone = ctx.createOscillator();
	const gain = ctx.createGain();
	osc.type = 'triangle';
	overtone.type = 'sine';
	osc.frequency.value = frequency;
	overtone.frequency.value = frequency * 2;
	gain.gain.setValueAtTime(0, now);
	gain.gain.linearRampToValueAtTime(volume, now + 0.015);
	gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
	// The overtone adds warmth at a quarter of the level, not brightness.
	const soft = ctx.createGain();
	soft.gain.value = 0.25;
	osc.connect(gain);
	overtone.connect(soft).connect(gain);
	gain.connect(tones);
	osc.start(now);
	overtone.start(now);
	osc.stop(now + duration);
	overtone.stop(now + duration);
}

/** Notes of a pentatonic scale, which sound pleasant in any order. */
export const LANE_NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
