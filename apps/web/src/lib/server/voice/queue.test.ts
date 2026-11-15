import { describe, expect, it, vi } from 'vitest';
import { kokoroThreads } from '../voice.ts';
import { hold } from './background.ts';
import { NeedQueue } from './queue.ts';

/* Jobs that finish when the test says so, recording the order they start in. */
function jobs() {
	const started: string[] = [];
	const finish = new Map<string, (ok: boolean) => void>();
	const work = (name: string) => () =>
		new Promise<string>((resolve, reject) => {
			started.push(name);
			finish.set(name, (ok) => (ok ? resolve(name) : reject(new Error(name))));
		});
	const tick = () => new Promise((r) => setTimeout(r, 0));
	const done = async (name: string, ok = true) => {
		finish.get(name)!(ok);
		await tick();
		await tick();
	};
	return { started, work, done, tick };
}

describe('render queue', () => {
	it('renders one at a time: the word in play first, then the look-ahead in order, slow clips last', async () => {
		const { started, work, done, tick } = jobs();
		const q = new NeedQueue<string>();
		void q.run('normal:one', 'soon', work('one'));
		void q.run('slow:one', 'later', work('slow one'));
		void q.run('normal:two', 'soon', work('two'));
		void q.run('normal:three', 'soon', work('three'));
		void q.run('normal:four', 'now', work('four'));
		await tick();
		expect(started).toEqual(['one']);
		await done('one');
		await done('four');
		await done('two');
		await done('three');
		expect(started).toEqual(['one', 'four', 'two', 'three', 'slow one']);
		expect(q.size).toBe(1);
	});

	it('joins a word asked for twice, moving it up when it is wanted sooner', async () => {
		const { started, work, done, tick } = jobs();
		const q = new NeedQueue<string>();
		const first = q.run('normal:one', 'soon', work('one'));
		void q.run('normal:two', 'soon', work('two'));
		void q.run('slow:one', 'later', work('slow one'));
		const again = q.run('slow:one', 'now', work('slow one, twice'));
		await tick();
		await done('one');
		expect(await first).toBe('one');
		expect(started).toEqual(['one', 'slow one']);
		await done('slow one');
		expect(await again).toBe('slow one');
		await done('two');
		expect(started).toEqual(['one', 'slow one', 'two']);
	});

	it('keeps going after a failed render, and fails only that word', async () => {
		const { started, work, done, tick } = jobs();
		const q = new NeedQueue<string>();
		const bad = q.run('normal:one', 'now', work('one')).catch((e: Error) => `failed: ${e.message}`);
		const good = q.run('normal:two', 'soon', work('two'));
		await tick();
		await done('one', false);
		expect(await bad).toBe('failed: one');
		await done('two');
		expect(await good).toBe('two');
		expect(started).toEqual(['one', 'two']);
		expect(q.size).toBe(0);
	});

	it('says when rendering starts and when nothing is left', async () => {
		const { work, done, tick } = jobs();
		const busy = vi.fn();
		const q = new NeedQueue<string>(busy);
		void q.run('normal:one', 'soon', work('one'));
		void q.run('normal:two', 'soon', work('two'));
		await tick();
		expect(busy.mock.calls).toEqual([[true]]);
		await done('one');
		expect(busy.mock.calls).toEqual([[true]]);
		await done('two');
		expect(busy.mock.calls).toEqual([[true], [false]]);
		void q.run('normal:three', 'soon', work('three'));
		expect(busy.mock.calls).toEqual([[true], [false], [true]]);
	});
});

describe('generator hold', () => {
	const child = () => ({ exitCode: null, signalCode: null, kill: vi.fn(() => true) });

	it('stops the generator while a word renders and lets it run after', () => {
		const c = child();
		expect(hold(c, true, 'darwin')).toBe(true);
		expect(hold(c, false, 'linux')).toBe(true);
		expect(c.kill.mock.calls).toEqual([['SIGSTOP'], ['SIGCONT']]);
	});

	it('leaves it alone on Windows and once it has exited', () => {
		const c = child();
		expect(hold(c, true, 'win32')).toBe(false);
		expect(hold({ ...c, exitCode: 0 }, true, 'linux')).toBe(false);
		expect(c.kill).not.toHaveBeenCalled();
	});
});

describe('Standard voice threads', () => {
	it('uses up to four cores, and at least one', () => {
		expect([1, 2, 4, 8, 16].map(kokoroThreads)).toEqual([1, 2, 4, 4, 4]);
		expect(kokoroThreads(0)).toBe(1);
	});
});
