/*
 * Blind listening vote, local only. `node vote.ts [rounds]`, then open http://127.0.0.1:5180
 * Each round plays one word from every contestant (best-scoring voice per engine, 80% or more) under shuffled letters, normal
 * or slow. Votes go to results/votes.json; names show only on /reveal.
 */

import { randomInt, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { ENGINES, clipFile } from './engines.ts';
import { BENCH_DIR } from './models.ts';
import { GROUPS } from './words.ts';

const RESULTS = path.join(BENCH_DIR, 'results');
const VOTES = path.join(RESULTS, 'votes.json');
const PORT = 5180;
const ROUNDS = Number(process.argv[2] ?? 24);

type Contestant = { engine: string; voice: string };
type Vote = { word: string; speed: string; winner: Contestant; heard: Contestant[]; at: string };

const scored: { engine: string; voice: string; normal: number }[] = JSON.parse(readFileSync(path.join(RESULTS, 'results.json'), 'utf8'));
const contestants: Contestant[] = ENGINES.flatMap((e) => {
	const best = scored.filter((r) => r.engine === e.id).sort((a, b) => b.normal - a.normal)[0];
	return best && best.normal >= 0.8 ? [{ engine: e.id, voice: best.voice }] : [];
});

const shuffle = <T>(xs: T[]) => {
	const a = [...xs];
	for (let i = a.length - 1; i > 0; i--) {
		const j = randomInt(i + 1);
		[a[i], a[j]] = [a[j]!, a[i]!];
	}
	return a;
};

/** Kokoro's misses always, the rest drawn across the groups. */
const words = [...GROUPS.misses, ...shuffle(Object.values(GROUPS).slice(1).flat())].slice(0, ROUNDS);
const votes: Vote[] = existsSync(VOTES) ? JSON.parse(readFileSync(VOTES, 'utf8')) : [];
const clips = new Map<string, string>();

type Round = { n: number; word: string; speed: string; order: Contestant[] };
let round: Round | null = null;

function next(): Round | null {
	const n = votes.length;
	const word = words.find((w) => !votes.some((v) => v.word === w));
	if (n >= words.length || !word) return null;
	clips.clear();
	return { n, word, speed: n % 2 ? 'slow' : 'normal', order: shuffle(contestants) };
}

const page = (r: Round) => {
	clips.clear();
	const buttons = r.order
		.map((c, i) => {
			const token = randomUUID();
			clips.set(token, clipFile(c.engine, c.voice, r.speed as 'normal' | 'slow', r.word));
			const letter = String.fromCharCode(65 + i);
			return `<div class="row"><button class="play" data-src="/clip/${token}">▶ ${letter}</button><button class="pick" data-i="${i}">Clearest</button></div>`;
		})
		.join('');
	return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Voice vote</title>
<style>body{font:16px system-ui;max-width:28rem;margin:2rem auto;padding:0 1rem}.row{display:flex;gap:.5rem;margin:.5rem 0}
button{font:inherit;padding:.6rem 1rem;border-radius:.5rem;border:1px solid #888;background:none;cursor:pointer}.play{flex:1;text-align:left}
h1{font-size:2rem;margin:.2rem 0}small{color:#777}</style>
<small>Round ${r.n + 1} of ${words.length} · ${r.speed}</small><h1>${r.word}</h1>
<p><small>Play each, then pick the one a learner would understand best.</small></p>${buttons}
<p><button id="all">Play all in order</button></p>
<script>
const a=new Audio();
document.querySelectorAll('.play').forEach(b=>b.onclick=()=>{a.src=b.dataset.src;a.play()});
document.getElementById('all').onclick=async()=>{for(const b of document.querySelectorAll('.play')){a.src=b.dataset.src;await a.play();await new Promise(r=>a.onended=r);await new Promise(r=>setTimeout(r,300))}};
document.querySelectorAll('.pick').forEach(b=>b.onclick=async()=>{await fetch('/vote',{method:'POST',body:b.dataset.i});location.reload()});
</script>`;
};

function reveal(): string {
	const tally = new Map<string, number>();
	for (const v of votes) tally.set(`${v.winner.engine}/${v.winner.voice}`, (tally.get(`${v.winner.engine}/${v.winner.voice}`) ?? 0) + 1);
	const rows = contestants
		.map((c) => `${c.engine}/${c.voice}`)
		.sort((a, b) => (tally.get(b) ?? 0) - (tally.get(a) ?? 0))
		.map((k) => `<tr><td>${k}</td><td>${tally.get(k) ?? 0}</td></tr>`)
		.join('');
	return `<!doctype html><meta charset="utf-8"><title>Voice vote</title><style>body{font:16px system-ui;margin:2rem}td{padding:.3rem 1rem}</style>
<h1>Votes (${votes.length})</h1><table>${rows}</table>`;
}

createServer((req, res) => {
	const url = req.url ?? '/';
	if (url.startsWith('/clip/')) {
		const file = clips.get(url.slice(6));
		if (!file) return res.writeHead(404).end();
		return res.writeHead(200, { 'content-type': 'audio/wav', 'cache-control': 'no-store' }).end(readFileSync(file));
	}
	if (url === '/vote' && req.method === 'POST' && round) {
		let body = '';
		req.on('data', (c) => (body += c));
		req.on('end', () => {
			const winner = round!.order[Number(body)];
			if (winner) {
				votes.push({ word: round!.word, speed: round!.speed, winner, heard: round!.order, at: new Date().toISOString() });
				writeFileSync(VOTES, JSON.stringify(votes, null, '\t'));
				round = null;
			}
			res.writeHead(204).end();
		});
		return;
	}
	if (url === '/reveal') return res.writeHead(200, { 'content-type': 'text/html' }).end(reveal());
	if (url !== '/') return res.writeHead(404).end();
	round ??= next();
	if (!round) return res.writeHead(200, { 'content-type': 'text/html' }).end(`${reveal()}<p>All rounds done.</p>`);
	res.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-store' }).end(page(round));
}).listen(PORT, '127.0.0.1', () => console.log(`vote: http://127.0.0.1:${PORT} (${contestants.length} voices, ${words.length} rounds)`));
