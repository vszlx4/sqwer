/* Downloads and unpacks the bench models that are missing. `node fetch.ts [name...]` */

import { createHash } from 'node:crypto';
import { createWriteStream, existsSync } from 'node:fs';
import { mkdir, rename, rm } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { ARCHIVES, MODELS_DIR, modelDir, type Archive } from './models.ts';

async function fetchArchive(a: Archive) {
	if (existsSync(modelDir(a.name))) return console.log(`have  ${a.name}`);
	const url = `https://github.com/k2-fsa/sherpa-onnx/releases/download/${a.release}/${a.name}.tar.bz2`;
	const file = path.join(MODELS_DIR, `${a.name}.tar.bz2`);
	await mkdir(MODELS_DIR, { recursive: true });
	const res = await fetch(url);
	if (!res.ok || !res.body) throw new Error(`${a.name}: ${res.status}`);
	const hash = createHash('sha256');
	const body = Readable.fromWeb(res.body);
	body.on('data', (chunk) => hash.update(chunk));
	await pipeline(body, createWriteStream(`${file}.part`));
	const sum = hash.digest('hex');
	if (!a.sha256) console.warn(`unpinned ${a.name}: sha256 ${sum}`);
	else if (sum !== a.sha256) {
		await rm(`${file}.part`, { force: true });
		throw new Error(`${a.name}: sha256 ${sum}, expected ${a.sha256}`);
	}
	await rename(`${file}.part`, file);
	execFileSync('tar', ['xjf', file, '-C', MODELS_DIR]);
	await rm(file);
	console.log(`got   ${a.name}`);
}

const only = process.argv.slice(2);
const list = only.length ? ARCHIVES.filter((a) => only.includes(a.name)) : ARCHIVES;
const results = await Promise.allSettled(list.map(fetchArchive));
const failed = results.filter((r) => r.status === 'rejected');
for (const r of failed) console.error(String((r as PromiseRejectedResult).reason));
process.exitCode = failed.length ? 1 : 0;
