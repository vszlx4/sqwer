/*
 * Words that sound the same. The hand-picked groups below are the reviewed base; each word list adds the groups the
 * Standard voice reads with the same phonemes (data/, made by `npm run heard:data`).
 */

import type { HeardData } from './data/index.ts';
import { americanSpelling } from './spelling.ts';

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

let base: Map<string, number[]> | null = null;
const loaded = new WeakMap<HeardData, Map<string, number[]>>();

/** Word → the groups it belongs to. A word can sit in more than one (read: red, reed). */
function index(groups: readonly (readonly string[])[]): Map<string, number[]> {
	const map = new Map<string, number[]>();
	groups.forEach((group, i) => {
		for (const w of group) map.set(w, [...(map.get(w) ?? []), i]);
	});
	return map;
}

function share(map: Map<string, number[]>, a: string, b: string): boolean {
	const x = map.get(a);
	const y = map.get(b);
	return !!x && !!y && x.some((g) => y.includes(g));
}

/** Whether two words sound the same, by the base groups or the list's own. */
export function soundsAlike(a: string, b: string, data?: HeardData): boolean {
	base ??= index(SOUND_ALIKE.trim().split('\n').map((line) => line.split(' ')));
	const x = americanSpelling(a, data);
	const y = americanSpelling(b, data);
	if (share(base, x, y)) return true;
	if (!data) return false;
	let own = loaded.get(data);
	if (!own) loaded.set(data, (own = index(data.sounds)));
	return share(own, a.toLowerCase(), b.toLowerCase()) || share(own, x, y);
}
