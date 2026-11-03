/*
 * Checking a word typed from speech. By ear, sound-alike words (their / there, read / red) cannot be told apart,
 * and British spellings (colour, organise, centre) are the same word. Both count as correct.
 */

/** Words pronounced the same in General American English, one group per line. */
const SOUND_ALIKE = `
to too two
there their they're
here hear
know no
new knew gnu
right write rite wright
whole hole
one won
for four fore
by buy bye
see sea
its it's
your you're
our hour
weather whether wether
week weak
piece peace
where wear ware
which witch
road rode rowed
sun son
meet meat mete
plane plain
tail tale
wait weight
flower flour
break brake
mail male
sail sale
heard herd
board bored
blue blew
bear bare
dear deer
ate eight
be bee
cent scent sent
sense cents scents
cell sell
seen scene
sight site cite
so sew sow
some sum
steal steel
stair stare
tea tee
threw through
throne thrown
toe tow
toad towed
way weigh whey
wood would
not knot
night knight
nose knows
pair pear pare
pain pane
pale pail
pole poll
pour pore
rain reign rein
read red
read reed
lead led
real reel
role roll
rose rows
sole soul
stake steak
tide tied
told tolled
waist waste
war wore
warn worn
whine wine
yolk yoke
allowed aloud
ball bawl
band banned
base bass
berry bury
billed build
boar bore
bold bowled
born borne
bread bred
bridal bridle
cereal serial
chews choose
coarse course
council counsel
creak creek
days daze
dew due
die dye
fair fare
feat feet
find fined
flea flee
flew flu flue
foul fowl
gait gate
genes jeans
groan grown
guessed guest
hair hare
hall haul
heal heel he'll
higher hire
him hymn
hoarse horse
holy wholly holey
idle idol
in inn
key quay
knead need kneed
knit nit
lessen lesson
loan lone
made maid
mane main
marshal martial
might mite
mind mined
missed mist
moose mousse
morning mourning
muscle mussel
naval navel
none nun
oar or ore
overdo overdue
pact packed
passed past
patience patients
paws pause
peak peek pique
peal peel
pedal peddle
plum plumb
praise prays preys
presence presents
principal principle
profit prophet
rap wrap
raise rays raze
ring wring
rote wrote
sax sacks
seam seem
sees seas seize
shoe shoo
side sighed
sighs size
slay sleigh
soar sore
stationary stationery
straight strait
suite sweet
tacks tax
taught taut
tear tier
there's theirs
thyme time
vain vane vein
wade weighed
waive wave
we'd weed
wheel we'll
while wile
whose who's
you'll yule
aisle isle i'll
ail ale
air heir
altar alter
arc ark
bail bale
bald bawled
beat beet
beach beech
bell belle
berth birth
bite byte
boos booze
bough bow
brews bruise
brows browse
cache cash
carrot carat karat caret
ceiling sealing
cellar seller
cheap cheep
chord cord
clause claws
colonel kernel
complement compliment
cue queue
currant current
dam damn
discreet discrete
doe dough
does doze
earn urn
ewe you yew
eye i aye
faint feint
fir fur
flair flare
forth fourth
freeze frieze
gorilla guerrilla
grate great
hay hey
hi high
hoes hose
leak leek
lie lye
links lynx
lo low
mall maul
manner manor
mantel mantle
meddle medal
metal mettle
miner minor
moan mown
mode mowed
oh owe
paced paste
peer pier
pray prey
pried pride
prince prints
rapped rapt wrapped
residence residents
rest wrest
review revue
roe row
rung wrung
rye wry
scull skull
seed cede
sheer shear
shone shown
sign sine
stile style
suede swayed
team teem
tense tents
throes throws
tic tick
troop troupe
undo undue
wail whale
wax whacks
we wee
wet whet
whirled world
whit wit
`;

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
let sounds: Map<string, number[]> | null = null;

/** Other spelling → American spelling. */
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

/** Word → the sound-alike groups it belongs to. A word can sit in more than one (read: red, reed). */
function soundGroups(): Map<string, number[]> {
	if (sounds) return sounds;
	const map = new Map<string, number[]>();
	SOUND_ALIKE.trim()
		.split('\n')
		.forEach((line, group) => {
			for (const w of line.split(' ')) map.set(w, [...(map.get(w) ?? []), group]);
		});
	return (sounds = map);
}

/** The American spelling of a word, or the word itself. */
export function americanSpelling(word: string): string {
	const w = normalizeAnswer(word);
	return variants().get(w) ?? w;
}

/** Whether two words sound the same. */
export function soundsAlike(a: string, b: string): boolean {
	const x = soundGroups().get(americanSpelling(a));
	const y = soundGroups().get(americanSpelling(b));
	return !!x && !!y && x.some((g) => y.includes(g));
}

export type HeardMatch = { ok: true; how: 'exact' | 'spelling' | 'sound' } | { ok: false };

/** Checks a word typed from hearing `target`: exact, another accepted spelling, or a word that sounds the same. */
export function matchHeard(target: string, answer: string): HeardMatch {
	const t = normalizeAnswer(target);
	const a = normalizeAnswer(answer);
	if (!a) return { ok: false };
	if (a === t) return { ok: true, how: 'exact' };
	if (americanSpelling(a) === americanSpelling(t)) return { ok: true, how: 'spelling' };
	if (soundsAlike(a, t)) return { ok: true, how: 'sound' };
	return { ok: false };
}
