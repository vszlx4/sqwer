import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FADE, MEMORY, Player } from './player.ts';

/* A fake audio graph: clips "play" until the test ends them; gains record their ramps. */
class FakeParam {
	value = 1;
	ramps: [string, number, number][] = [];
	setValueAtTime(v: number, t: number) {
		this.value = v;
		this.ramps.push(['set', v, t]);
	}
	linearRampToValueAtTime(v: number, t: number) {
		this.value = v;
		this.ramps.push(['ramp', v, t]);
	}
	setTargetAtTime(v: number) {
		this.value = v;
	}
	cancelScheduledValues() {}
}
class FakeNode {
	gain = new FakeParam();
	connect<T>(n: T) {
		return n;
	}
}
class FakeSource {
	connect<T>(n: T) {
		return n;
	}
	buffer: { duration: number } | null = null;
	onended: (() => void) | null = null;
	started = false;
	stoppedAt: number | null = null;
	start() {
		this.started = true;
	}
	stop(t: number) {
		this.stoppedAt = t;
		this.onended?.();
	}
	end() {
		this.onended?.();
	}
}
class FakeContext {
	currentTime = 10;
	state = 'running';
	sources: FakeSource[] = [];
	gains: FakeNode[] = [];
	createGain() {
		const g = new FakeNode();
		this.gains.push(g);
		return g;
	}
	createBufferSource() {
		const s = new FakeSource();
		this.sources.push(s);
		return s;
	}
	async decodeAudioData(body: ArrayBuffer) {
		if (body.byteLength === 0) throw new Error('bad audio');
		return { duration: 0.5, getChannelData: () => new Float32Array(4800) };
	}
	async resume() {}
}

let ctx: FakeContext;
let volume = 0.8;
let calls: string[] = [];
let answer: (url: string) => Response;

const player = () =>
	new Player({
		graph: () => ({ ctx: ctx as unknown as AudioContext, voice: new FakeNode() as unknown as GainNode }),
		volume: () => volume,
		saveVolume: (v) => (volume = v)
	});
const tick = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
	ctx = new FakeContext();
	volume = 0.8;
	calls = [];
	answer = (url) => (url.includes('zzmissing') ? new Response(null, { status: 404 }) : new Response(new Uint8Array(8)));
	vi.stubGlobal('AudioContext', FakeContext);
	vi.stubGlobal('fetch', async (url: string) => {
		calls.push(url);
		if (url === '/api/voice?version') return Response.json({ voice: 'standard', version: 'v1' });
		return answer(url);
	});
});
afterEach(() => vi.unstubAllGlobals());

describe('voice player', () => {
	it('moves a word through loading, ready, playing and back', async () => {
		const v = player();
		const loaded = v.clip('House');
		expect(v.state('house')).toBe('loading');
		await loaded;
		expect(v.state('house')).toBe('ready');
		expect(calls).toEqual(['/api/voice?version', '/voice/v1/auto/normal/house']);
		const said = v.say('house');
		await tick();
		expect(v.state('house')).toBe('playing');
		expect(v.speaking).toBe(true);
		ctx.sources[0]!.end();
		expect(await said).toBe('played');
		expect(v.state('house')).toBe('ready');
		expect(v.speaking).toBe(false);
	});

	it('marks a word with no clip missing and never asks again', async () => {
		const v = player();
		expect(await v.say('zzmissing')).toBe('missing');
		expect(v.state('zzmissing')).toBe('missing');
		await v.clip('zzmissing');
		expect(calls.filter((c) => c.includes('zzmissing'))).toHaveLength(1);
		expect(await v.say("not a word!")).toBe('missing');
	});

	it('keeps the normal clip when only the slow one is missing', async () => {
		const v = player();
		answer = (url) => (url.includes('/slow/') ? new Response(null, { status: 404 }) : new Response(new Uint8Array(8)));
		expect(await v.clip('house', 'slow')).toBeNull();
		expect(v.state('house')).not.toBe('missing');
		expect(await v.clip('house')).not.toBeNull();
		expect(v.state('house')).toBe('ready');
	});

	it('marks a failed fetch as an error and tries again on the next play', async () => {
		const v = player();
		answer = () => new Response(null, { status: 503 });
		expect(await v.say('house')).toBe('error');
		expect(v.state('house')).toBe('error');
		answer = () => new Response(new Uint8Array(8));
		const said = v.say('house');
		await tick();
		expect(v.state('house')).toBe('playing');
		ctx.sources[0]!.end();
		expect(await said).toBe('played');
	});

	it('marks audio that will not decode as an error', async () => {
		answer = () => new Response(new Uint8Array(0));
		const v = player();
		expect(await v.say('house')).toBe('error');
	});

	it('asks for the version again once the voice changed', async () => {
		let version = 'v1';
		vi.stubGlobal('fetch', async (url: string) => {
			calls.push(url);
			if (url === '/api/voice?version') return Response.json({ voice: 'standard', version });
			return url.includes(`/${version}/`) ? new Response(new Uint8Array(8)) : new Response(null, { status: 410 });
		});
		const v = player();
		await v.clip('one');
		version = 'v2';
		await v.clip('two');
		expect(calls).toEqual(['/api/voice?version', '/voice/v1/auto/normal/one', '/voice/v1/auto/normal/two', '/api/voice?version', '/voice/v2/auto/normal/two']);
		expect(v.state('two')).toBe('ready');
	});

	it('fetches slow and normal clips as their own addresses', async () => {
		const v = player();
		v.prepare(['house'], 'slow');
		await v.clip('house', 'slow');
		expect(calls).toContain('/voice/v1/auto/slow/house');
		expect(v.state('house')).toBeUndefined();
	});

	it('keeps the last MEMORY words and fetches older ones again', async () => {
		// Clip words are letters only: 0 → "a", 26 → "ba".
		const name = (i: number): string => (i < 26 ? '' : name(Math.floor(i / 26) - 1)) + 'abcdefghijklmnopqrstuvwxyz'[i % 26];
		const v = player();
		for (let i = 0; i < MEMORY; i++) await v.clip(name(i));
		calls = [];
		await v.clip(name(0));
		expect(calls).toHaveLength(0);
		await v.clip(name(MEMORY));
		await v.clip(name(1));
		expect(calls).toEqual([`/voice/v1/auto/normal/${name(MEMORY)}`, `/voice/v1/auto/normal/${name(1)}`]);
	});

	it('fades in, and fades out before stopping', async () => {
		const v = player();
		const said = v.say('house');
		await tick();
		const src = ctx.sources[0]!;
		const fade = ctx.gains.at(-1)!.gain;
		expect(fade.ramps.slice(0, 2)).toEqual([
			['set', 0, 10],
			['ramp', 1, 10 + FADE]
		]);
		v.stop();
		expect(fade.ramps.at(-1)).toEqual(['ramp', 0, 10 + FADE]);
		expect(src.stoppedAt).toBe(10 + FADE);
		expect(await said).toBe('stopped');
		expect(v.speaking).toBe(false);
	});

	it('lets a newer word cut off the one playing', async () => {
		const v = player();
		const first = v.say('one');
		await tick();
		const second = v.say('two');
		await tick();
		await tick();
		expect(await first).toBe('stopped');
		expect(v.state('two')).toBe('playing');
		ctx.sources.at(-1)!.end();
		expect(await second).toBe('played');
	});

	it('keeps the volume between 0 and 1', () => {
		const v = player();
		v.setVolume(1.4);
		expect(v.volume).toBe(1);
		v.setVolume(-1);
		expect(v.volume).toBe(0);
	});
});
