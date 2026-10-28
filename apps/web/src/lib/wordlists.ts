import { EXAM_WORDS, parseWordList, type WordListId } from '@sqwer/content';

// List files are hashed assets, fetched on first use (vite.config.ts keeps them out of inlining for the CSP).
const files = import.meta.glob<string>('../../../../packages/content/lists/*.txt', { import: 'default' });

const cache = new Map<WordListId, Promise<readonly string[]>>();

async function fetchList(id: WordListId): Promise<readonly string[]> {
	if (id === 'english-200') return EXAM_WORDS;
	const url = await files[`../../../../packages/content/lists/${id}.txt`]?.();
	if (!url) throw new Error(`Unknown word list: ${id}`);
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Word list ${id} failed to load (${res.status}).`);
	return parseWordList(await res.text());
}

/** Words of a list, loaded once per visit. */
export function loadWordList(id: WordListId): Promise<readonly string[]> {
	let list = cache.get(id);
	if (!list) {
		list = fetchList(id);
		cache.set(id, list);
		list.catch(() => cache.delete(id));
	}
	return list;
}

/** Lowercase words of a list made only of the letters a to z, for the games. */
export async function letterWords(id: WordListId, filter: (w: string) => boolean = () => true): Promise<string[]> {
	const out = new Set<string>();
	for (const w of await loadWordList(id)) {
		const lower = w.toLowerCase();
		if (/^[a-z]+$/.test(lower) && filter(lower)) out.add(lower);
	}
	return [...out];
}
