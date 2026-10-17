import { ENGLISH_WORDS } from './english.ts';
import { MAPPING_WORDS } from './mapping.ts';

/**
 * Additional short, everyday words compiled for sqwer's course. They give early lessons,
 * which only know a few keys, real words to practise as soon as possible.
 */
const COURSE_EXTRA = `
a as ad add ads all alas ask asks dad dads fad fads fall falls flask lad lads lass sad salad
salads jak flak flask flasks skald dash gash hash lash flash glass gas gal gals gaff half hall
halls shall shag sag sags lag lags hag jag flag flags slag slags has had hash gash shah ash
ha hah aha la fa
see seed seeds seek feed feeds feel feels heel heels jeer kale lake fake sake take shake
desk desks sled sleds field fields shelf shield aide aides hide hides side sides slide slides
idea ideas lid lids kid kids skid skids skill skills fill fills hill hills kill gill dill
like likes life lifes file files filed jail jails sail sails hail fail fails laid said
skies dies lies ties fries die lie tie hie egg eggs leg legs keg kegs jig jigs dig digs fig
figs gig hike hikes jade fade glide gild gilded shied sheaf deaf leaf leaked leafs
red rid ride rides rule rules rude rush rug rugs run runs rust ruse fur furs sure
true tree trees treat great greet street sheet sheets three tired tire tires their
tire writer write wrote quiet quite quit quilt quest queue equal
you your yes yet yell yard year yeast type types tidy duty fury ugly
we wet west wide wise wire wore word words world work works wood wool owl owls own owns
how wow tow row sow low lot lots old odd off oil oils toil soil foil
pop pup put pot pie pier pipe ripe paper pepper upper pupil equip
quote quotes quart quarter quiz quip
very vote votes voice move moves have give live love above vast vest
my me man men mine mind more much must music mud mug
cat cut cut can cap cop cub cube cake coat cost cold call calm clue clear cool core
ox box fox fix six mix wax tax text next taxi exit extra
zoo zip zero size zone lazy fuzz buzz jazz quiz maze
bag bad bed bid big bud bus but buy bit bat bet bike boat bold book both bell bill
nab nap net nip not nut new now nod note name near nice nine noon none
`;

/** A larger practice vocabulary: everyday words, deduplicated, lowercase letters only. */
export const COURSE_WORDS: readonly string[] = Array.from(
	new Set([...ENGLISH_WORDS, ...MAPPING_WORDS, ...COURSE_EXTRA.split(/\s+/)].filter((w) => /^[a-z]+$/.test(w)))
);

/**
 * Words that can be typed with only the given letters, shortest first.
 * When `focus` is given, every word contains at least one of those letters.
 */
export function wordsUsing(letters: string, focus = ''): string[] {
	const allowed = new Set(letters.toLowerCase());
	const required = new Set(focus.toLowerCase());
	return COURSE_WORDS.filter(
		(w) => [...w].every((c) => allowed.has(c)) && (required.size === 0 || [...w].some((c) => required.has(c)))
	).sort((a, b) => a.length - b.length || a.localeCompare(b));
}

/** Short original sentences for practising capital letters and full stops. */
export const CAPITAL_SENTENCES: readonly string[] = [
	'The sun is up.',
	'Sam has a red kite.',
	'We like the lake.',
	'Anna reads a book.',
	'It is a fine day.',
	'Leo will see us at noon.',
	'The dog sat on the rug.',
	'Our team won the game.',
	'Kate likes green tea.',
	'Rain fell all night.',
	'The train left at nine.',
	'Max and Ivy walk home.',
	'Paris is a large city.',
	'Tom fixed the old bike.',
	'The cat sleeps a lot.',
	'June is a warm month.',
	'Omar painted the fence blue.',
	'The library opens at noon.',
	'Nora bakes bread on Fridays.',
	'A cold wind came from the north.',
	'Ben keeps his notes in a box.',
	'The river runs past the mill.',
	'Lina found a shell on the beach.',
	'Every lamp in the hall was on.',
	'Rome has many old streets.',
	'The baker smiled at the boy.',
	'Ella plays the piano at night.',
	'Our class planted ten trees.',
	'The moon rose over the hills.',
	'Hana wrote a long letter.',
	'Snow covered the quiet road.',
	'Felix drinks warm milk.',
	'The market is busy today.',
	'Ivan lost his blue scarf.',
	'A small bird sang outside.',
	'Grace runs before breakfast.',
	'Cairo is a very old city.',
	'The shop sells fresh fruit.',
	'Yusuf helped his sister cook.',
	'The ship left the harbour early.'
];

/** Short original sentences that use common punctuation. */
export const PUNCTUATION_SENTENCES: readonly string[] = [
	'Yes, it is ready.',
	'Where is the key?',
	'Stop! The road is wet.',
	"It's a quiet morning.",
	'We need milk, bread and eggs.',
	"Don't forget your coat.",
	'Is it true? I think so.',
	'Look out, the floor is slick!',
	"Mia's desk is by the window.",
	'Well, that was quick.',
	'Can you hear the music?',
	"They're late again; let's wait.",
	'Bring a pen, a pad and a map.',
	"What a lovely view!",
	'First, read the note.',
	"I'll call you at ten.",
	'Wait, did you lock the door?',
	'Oh no, the tea is cold!',
	"Sara's bag is on the chair.",
	'We met Leo, Ana and Noor.',
	"It's late; we should go home.",
	"Please, don't touch the paint.",
	'How far is the station?',
	'Great work, everyone!',
	"The cat's bowl is empty.",
	'First wash, then dry, then fold.',
	'Are you sure? Check again.',
	"We're nearly there, I think.",
	'Read the page, then answer.',
	"Who's coming to dinner?",
	'No, thank you; I am full.',
	'Here it is: the missing key.',
	"Isn't the garden lovely?",
	'Take a seat, please.',
	'Well done! You finished early.',
	"Let's try once more.",
	'Turn left, then right.',
	"The children's room is upstairs.",
	'Quick, the bus is here!',
	'Do you have a spare pen?'
];

/** Short original sentences with numbers. */
export const NUMBER_SENTENCES: readonly string[] = [
	'Meet me at 7 or 8.',
	'The room has 24 chairs.',
	'She ran 5 miles in 41 minutes.',
	'Call 555 0192 after 6.',
	'We need 3 cups and 12 plates.',
	'The year 2031 starts soon.',
	'Page 86 has the answer.',
	'It took 90 days to build.',
	'Buy 4 apples and 10 pears.',
	'The bus leaves at 15 past 9.',
	'The class starts at 8 and ends at 3.',
	'Our flat is on floor 17.',
	'He scored 96 out of 100.',
	'The shop opens 7 days a week.',
	'Bring 2 pens and 1 notebook.',
	'The film lasts 128 minutes.',
	'We walked 14 miles on Monday.',
	'Room 302 is at the end.',
	'The recipe needs 250 grams of flour.',
	'My bike has 21 gears.',
	'The race had 64 runners.',
	'Set the alarm for 6 45.',
	'There are 52 cards in a deck.',
	'The bridge is 870 metres long.',
	'She was born in 1998.',
	'The train has 11 carriages.',
	'Add 9 and 13 to get 22.',
	'The museum has 340 paintings.',
	'We sold 75 tickets today.',
	'The plant grew 30 centimetres.'
];

/** Short original sentences for pace, accuracy and endurance practice. */
export const PRACTICE_SENTENCES: readonly string[] = [
	'a steady pace is faster than a rush of keys',
	'keep your eyes on the screen and your hands at home',
	'every key has a finger and every finger has a home',
	'type the word you see and then the next one',
	'small daily practice builds lasting skill',
	'slow and accurate today becomes fast tomorrow',
	'the home row is where each finger rests',
	'reach for the key and return to the home row',
	'calm hands make fewer errors than tense hands',
	'a good typist reads ahead while the fingers move',
	'rest your wrists lightly and keep your shoulders loose',
	'look at the next word before you finish this one',
	'accuracy comes first and speed follows on its own',
	'each finger moves only as far as it needs to',
	'press each key with a light and even touch',
	'a short break helps your hands stay relaxed',
	'the space bar belongs to the thumb of either hand',
	'return to the home row after every reach',
	'practise the hard keys a little every day',
	'let your fingers learn the shape of common words',
	'breathe slowly and keep a calm and even pace',
	'a mistake is a lesson about where a key lives',
	'the little finger reaches far so give it time',
	'typing well is a habit built one key at a time',
	'sit up straight and keep your feet on the floor',
	'your eyes guide the words and your hands do the rest',
	'speed grows when you stop looking at the keys',
	'common words soon feel like a single movement',
	'type in phrases rather than in single letters',
	'an even beat makes long passages feel easier',
	'the best practice is short and focused and daily',
	'fix one habit at a time and give it a week',
	'curve your fingers gently over the keys',
	'strike the keys and lift your fingers at once',
	'every new key joins the ones you already know',
	'reading ahead keeps your hands from waiting',
	'a calm mind types more accurately than a hurried one',
	'the middle row is home and the other rows are visits',
	'watch the screen and trust your hands to find the keys',
	'long words are just short patterns joined together',
	'slow down on hard words and speed up on easy ones',
	'a steady pace across a minute beats a fast start',
	'your thumbs rest gently on the space bar',
	'the index fingers cover the most keys of all',
	'stretch the fingers before you begin to type',
	'finish each word cleanly before you start the next',
	'patience with the keys today brings speed tomorrow',
	'good posture protects your back and your wrists',
	'the shift key uses the little finger of the other hand',
	'practice makes the keyboard feel like part of you'
];
