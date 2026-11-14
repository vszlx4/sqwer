/*
 * Spellings that are the same word: British and American (colour, organise, centre), by the rules and pairs below,
 * plus the reviewed pairs each word list carries (data/). American is the source spelling.
 */

import type { HeardData } from './data/index.ts';

/** British (or other accepted) spelling, then the American one, one pair per line. */
const PAIRS = `
grey gray
greys grays
greyish grayish
tyre tire
tyres tires
plough plow
ploughs plows
ploughed plowed
cheque check
cheques checks
programme program
programmes programs
aluminium aluminum
sceptic skeptic
sceptics skeptics
sceptical skeptical
scepticism skepticism
mould mold
moulds molds
mouldy moldy
moult molt
smoulder smolder
smouldering smoldering
cosy cozy
cosier cozier
pyjamas pajamas
aeroplane airplane
aeroplanes airplanes
storey story
storeys stories
draught draft
draughts drafts
draughty drafty
gaol jail
judgement judgment
judgements judgments
acknowledgement acknowledgment
ageing aging
whisky whiskey
doughnut donut
doughnuts donuts
artefact artifact
artefacts artifacts
kerb curb
kerbs curbs
sulphur sulfur
moustache mustache
practise practice
practised practiced
practises practices
practising practicing
axe ax
jewellery jewelry
woollen woolen
woolly wooly
marvellous marvelous
manoeuvre maneuver
manoeuvres maneuvers
manoeuvred maneuvered
enrol enroll
enrols enrolls
enrolment enrollment
fulfil fulfill
fulfils fulfills
fulfilment fulfillment
instil instill
distil distill
skilful skillful
wilful willful
instalment installment
learnt learned
spelt spelled
dreamt dreamed
burnt burned
leapt leaped
spoilt spoiled
knelt kneeled
spilt spilled
towards toward
afterwards afterward
centred centered
centring centering
catalogued cataloged
cataloguing cataloging
encyclopaedia encyclopedia
paediatric pediatric
paediatrician pediatrician
anaemia anemia
anaemic anemic
anaesthesia anesthesia
anaesthetic anesthetic
haemoglobin hemoglobin
haemorrhage hemorrhage
leukaemia leukemia
orthopaedic orthopedic
archaeology archeology
archaeologist archeologist
mediaeval medieval
foetus fetus
oestrogen estrogen
oesophagus esophagus
diarrhoea diarrhea
aesthetic esthetic
aeon eon
glamour glamor
`;

/** -our ↔ -or, with the endings both spellings share. */
const OUR = 'colour favour honour labour neighbour behaviour humour flavour rumour harbour vapour savour armour endeavour parlour rigour splendour tumour odour valour vigour clamour candour fervour saviour';
const OUR_ENDINGS = ['', 's', 'ed', 'ing', 'ful', 'fully', 'less', 'able', 'ably', 'ite', 'ites', 'er', 'ers', 'hood', 'hoods', 'y'];

/** Stems spelled -ise in British English and -ize in American; -ise-only verbs (advertise, surprise) are not here. */
const IZE =
	'organ real recogn apolog critic emphas special summar author categor civil character colon computer econom energ final general harmon hospital ideal immun industrial jeopard legal local maxim memor minim mobil modern neutral normal optim patron penal polar popular priorit public rational revolution sanit scrutin standard stabil steril subsid symbol sympath synchron util visual vandal agon antagon capital central commercial crystal democrat digit dramat equal familiar fertil fossil global human hypnot internal item liberal magnet marginal material mechan mesmer metabol militar moral motor national natural oxid personal philosoph privat radical random revital romantic scandal sensit social stigmat tantal terror theor tranquil trivial tyrann urban vocal western'.split(' ');
const IZE_ENDINGS = ['e', 'es', 'ed', 'ing', 'er', 'ers', 'ation', 'ations', 'able'];

/** -yse ↔ -yze. */
const YZE = 'anal paral catal dial electrol hydrol psychoanal'.split(' ');
const YZE_ENDINGS = ['e', 'es', 'ed', 'ing', 'er', 'ers'];

/** -tre ↔ -ter. */
const TRE = 'centre theatre metre litre fibre calibre sombre spectre lustre meagre sabre mitre ochre sceptre kilometre centimetre millimetre';

/** Stems that double the l before an ending in British English only. */
const LL =
	'travel cancel label model fuel level signal channel counsel dial duel equal jewel marvel quarrel tunnel total rival panel pencil shovel swivel funnel grovel libel revel snorkel yodel enamel initial pummel refuel spiral stencil towel chisel barrel bevel carol'.split(' ');
const LL_ENDINGS = ['ed', 'ing', 'er', 'ers', 'or', 'ors'];

/** -ence ↔ -ense and -ogue ↔ -og. */
const ENCE = 'defence offence pretence licence';
const OGUE = 'catalogue dialogue analogue monologue epilogue prologue travelogue';


/** Lowercase, straight apostrophes, single spaces. */
export function normalizeAnswer(text: string): string {
	return text.trim().toLowerCase().replace(/[‘’ʼ]/g, "'").replace(/\s+/g, ' ');
}

let american: Map<string, string> | null = null;
const loaded = new WeakMap<HeardData, Map<string, string>>();

/** Other spelling → American spelling, by the built-in rules. */
function variants(): Map<string, string> {
	if (american) return american;
	const map = new Map<string, string>();
	const add = (other: string, us: string) => {
		if (other !== us) map.set(other, us);
	};
	for (const line of PAIRS.trim().split('\n')) {
		const [other, us] = line.split(' ');
		add(other!, us!);
	}
	for (const w of OUR.split(' ')) for (const e of OUR_ENDINGS) add(w + e, w.replace(/our$/, 'or') + e);
	for (const s of IZE) for (const e of IZE_ENDINGS) add(`${s}is${e}`, `${s}iz${e}`);
	for (const s of YZE) for (const e of YZE_ENDINGS) add(`${s}ys${e}`, `${s}yz${e}`);
	for (const w of TRE.split(' ')) for (const e of ['', 's']) add(w + e, w.replace(/re$/, 'er') + e);
	for (const s of LL) for (const e of LL_ENDINGS) add(`${s}l${e}`, s + e);
	for (const w of ENCE.split(' ')) for (const e of ['', 's']) add(w + e, w.replace(/ence$/, 'ense') + e);
	for (const w of OGUE.split(' ')) for (const e of ['', 's']) add(w + e, w.replace(/ue$/, '') + e);
	return (american = map);
}

/** The American spelling of a word, or the word itself. */
export function americanSpelling(word: string, data?: HeardData): string {
	const w = normalizeAnswer(word);
	const rule = variants().get(w);
	if (rule || !data) return rule ?? w;
	let own = loaded.get(data);
	if (!own) loaded.set(data, (own = new Map(data.variants)));
	return own.get(w) ?? w;
}

let british: Map<string, string> | null = null;
const loadedBritish = new WeakMap<HeardData, Map<string, string>>();

/** American → the first other spelling listed for it. */
const reverse = (pairs: Iterable<readonly [string, string]>) => {
	const map = new Map<string, string>();
	for (const [other, us] of pairs) if (!map.has(us)) map.set(us, other);
	return map;
};

/** The British spelling of a word, when it has one. */
export function britishSpelling(word: string, data?: HeardData): string | null {
	const us = americanSpelling(word, data);
	british ??= reverse(variants());
	const rule = british.get(us);
	if (rule || !data) return rule ?? null;
	let own = loadedBritish.get(data);
	if (!own) loadedBritish.set(data, (own = reverse(data.variants)));
	return own.get(us) ?? null;
}
