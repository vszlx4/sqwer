// Copies the real course data from the current site (apps/web) into src/content/course.json, so the new
// pages show the actual chapters, ranks, leagues and examinations. Run after the course changes:
//   npm run content -w site
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CHAPTERS, LESSONS, PARTS } from '../../web/src/lib/courses/catalog.ts';
import { RANKS } from '../../web/src/lib/courses/progression.ts';
import { CATEGORIES, EXAMS } from '../../web/src/lib/exams.ts';
import { LEAGUES, TIERS } from '../../web/src/lib/progress/competitive.ts';

const steps: Record<string, number> = {};
for (const lesson of LESSONS) for (const step of lesson.steps) steps[step.kind] = (steps[step.kind] ?? 0) + 1;

const data = {
	source: 'apps/web/src/lib (catalog, progression, exams, progress/competitive)',
	lessons: LESSONS.length,
	steps,
	parts: PARTS.map((p) => ({ id: p.id, title: p.title, summary: p.summary, chapters: [...p.chapters] })),
	chapters: CHAPTERS.map((c) => {
		const newKeys = [...new Set(c.lessons.flatMap((l) => l.newKeys))];
		// A few real words the chapter practises, for chapters that add no new keys.
		const words = [...new Set(c.lessons.flatMap((l) => l.steps.flatMap((s) => ('words' in s && Array.isArray(s.words) ? s.words : []))))].slice(0, 4);
		return { number: c.number, title: c.title, summary: c.summary, newKeys, words, lessons: c.lessons.map((l) => l.title) };
	}),
	ranks: RANKS.map((r) => ({ level: r.level, name: r.name, note: r.note, tier: r.tier })),
	leagues: LEAGUES.map((l) => {
		const tiers = TIERS.filter((t) => t.league.id === l.id);
		return { id: l.id, name: l.name, from: tiers[0]!.from, divisions: tiers.length };
	}),
	examCategories: CATEGORIES,
	exams: EXAMS.map((e) => ({ id: e.id, title: e.title, category: e.category, purpose: e.purpose, measures: e.measures, duration: e.duration }))
};

const out = fileURLToPath(new URL('../src/content/course.json', import.meta.url));
writeFileSync(out, JSON.stringify(data, null, '\t') + '\n');
console.log(`Wrote ${data.chapters.length} chapters, ${data.lessons} lessons, ${data.ranks.length} ranks, ${data.leagues.length} leagues, ${data.exams.length} examinations.`);
