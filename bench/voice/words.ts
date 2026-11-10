/* The bench word set: the same 200 words for every engine. */

const set = (s: string) => s.trim().split(/\s+/);

export const GROUPS = {
	/** Kokoro got these wrong in Listen and type (niche came out as "n-itch"). */
	misses: set('bought joy organ main since thin neck niche'),
	/** Common words from the lessons. */
	everyday: set(`
		the and that have with this from they would there their what about which when make like time just know
		take people into year your good some could them other than then look only come over think also back after
		use work first well way even want because these give most day very find thing tell many need house world
		school still hand high where right small large place old long great little own another same between under
		never home water family move answer paper music friend money night again point mother city tree cross farm
		hard start might story saw far sea left late run while press close real life few north open
		mountain enough idea`),
	/** Spelled the same, said two ways; any spelling match counts. */
	heteronyms: set('read lead live wind tear bass record object present minute wound desert bow content produce'),
	/** One sound apart. */
	pairs: set('ship sheep bat bet fan van thick sick light write pull pool cot caught full fool'),
	/** Short and easy to swallow. */
	short: set('ox egg in up it at on is we go'),
	/** Long, many syllables. */
	long: set(`
		extraordinary responsibility unbelievable comfortable temperature vegetable particularly necessary
		environment pronunciation entrepreneur refrigerator photography independent opportunity communication`),
	/** Apostrophes, hyphens and spellings that do not sound out. */
	tricky: set(`don't it's well-known colonel yacht choir island queue wednesday february rhythm knight subtle
		receipt doubt psychology muscle salmon`)
};

export const WORDS: string[] = [...new Set(Object.values(GROUPS).flat())];
