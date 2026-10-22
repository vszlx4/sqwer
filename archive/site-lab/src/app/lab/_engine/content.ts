// Realistic copy for eight kinds of site, so every design is judged on content that behaves like content.

export type Feature = { title: string; body: string; tag: string };
export type Subject = {
	id: string;
	name: string;
	brand: string;
	mark: string;
	nav: string[];
	eyebrow: string;
	title: string;
	/** The word or phrase inside the title that gets the accent treatment. */
	hl: string;
	sub: string;
	cta: string;
	cta2: string;
	features: Feature[];
	stats: { v: string; l: string }[];
	quote: { text: string; who: string; role: string };
	steps: { title: string; body: string }[];
	gallery: string[];
	closing: { title: string; sub: string; button: string };
	footer: string;
	items: { name: string; meta: string; price: string }[];
	ticker: string[];
};

export const SUBJECTS: Subject[] = [
	{
		id: 'typing',
		name: 'Typing school',
		brand: 'sqwer',
		mark: 'sq',
		nav: ['Course', 'Fingers', 'Practice', 'Schools'],
		eyebrow: 'A typing course for beginners',
		title: 'Learn to type with every finger.',
		hl: 'every finger',
		sub: 'Twelve short lessons that teach the home row first, then the rest of the keyboard, and that notice which finger you actually use for each key.',
		cta: 'Choose your level',
		cta2: 'See the course',
		features: [
			{ title: 'Home row first', body: 'Eight keys, two hands, no guessing. You start where your fingers already rest.', tag: 'Lesson 1' },
			{ title: 'Finger map', body: 'Every key shows the finger that owns it, numbered thumb to little finger.', tag: 'Guidance' },
			{ title: 'Live accuracy', body: 'Errors are counted per key, so the course repeats what you actually miss.', tag: 'Feedback' },
			{ title: 'Short sessions', body: 'Ten minutes a day is enough. Each session ends on something you got right.', tag: 'Habit' },
			{ title: 'For classrooms', body: 'Teachers see progress by class, with nothing for pupils to configure.', tag: 'Schools' },
			{ title: 'Works offline', body: 'Lessons are small and cached, so a slow school network does not stop practice.', tag: 'Access' }
		],
		stats: [
			{ v: '12', l: 'guided lessons' },
			{ v: '38', l: 'wpm after six weeks' },
			{ v: '97%', l: 'accuracy by lesson 8' }
		],
		quote: { text: 'My class stopped looking at the keys in the third week. I did not have to say a word about it.', who: 'Maren Holt', role: 'Year 5 teacher, Aberdeen' },
		steps: [
			{ title: 'Place your hands', body: 'Rest eight fingers on the home row. The first lesson only asks for that.' },
			{ title: 'Follow the numbers', body: 'Each letter carries the number of the finger that types it.' },
			{ title: 'Repeat what slips', body: 'Keys you miss come back in the next session until they stop slipping.' }
		],
		gallery: ['Home row', 'Left hand', 'Right hand', 'First sentence'],
		closing: { title: 'Ten minutes today.', sub: 'No account needed to start the first lesson.', button: 'Start lesson one' },
		footer: 'Typing, taught patiently.',
		items: [
			{ name: 'Home row', meta: 'asdf jkl;', price: 'Lesson 1' },
			{ name: 'Top row', meta: 'qwer uiop', price: 'Lesson 3' },
			{ name: 'Bottom row', meta: 'zxcv m,./', price: 'Lesson 5' },
			{ name: 'Capitals and shift', meta: 'Aa Bb Cc', price: 'Lesson 7' },
			{ name: 'Numbers', meta: '1234 7890', price: 'Lesson 9' },
			{ name: 'Punctuation', meta: ', . ; : ! ?', price: 'Lesson 11' }
		],
		ticker: ['home row', 'finger one', 'accuracy first', 'ten minutes', 'no looking down', 'steady rhythm']
	},
	{
		id: 'atelier',
		name: 'Fashion house',
		brand: 'Maison Verlaine',
		mark: 'MV',
		nav: ['Collections', 'Atelier', 'Journal', 'Boutiques'],
		eyebrow: 'Autumn / Winter 2026',
		title: 'Cut slowly, worn for decades.',
		hl: 'worn for decades',
		sub: 'Coats, knitwear and tailoring made in a single workshop in Lyon from wool woven within two hundred kilometres of the cutting table.',
		cta: 'View the collection',
		cta2: 'Book a fitting',
		features: [
			{ title: 'The overcoat', body: 'Double-faced Merino with a hand-felled collar. Eleven hours at the bench.', tag: 'Outerwear' },
			{ title: 'Knit no. 4', body: 'A fully fashioned jumper in undyed Shetland, shaped without a single seam at the shoulder.', tag: 'Knitwear' },
			{ title: 'The trouser', body: 'High-rise, pleated, with a split waistband that adjusts to the day.', tag: 'Tailoring' },
			{ title: 'Silk shirting', body: 'Washed silk twill, cut on the straight grain and finished with mother-of-pearl.', tag: 'Shirting' },
			{ title: 'Leather goods', body: 'Vegetable-tanned in the Tarn, burnished by hand, repaired free for life.', tag: 'Accessories' },
			{ title: 'Made to measure', body: 'Three fittings over six weeks. Your pattern is kept and reused.', tag: 'Service' }
		],
		stats: [
			{ v: '1962', l: 'founded in Lyon' },
			{ v: '14', l: 'makers in the atelier' },
			{ v: '30 yrs', l: 'repair guarantee' }
		],
		quote: { text: 'The first coat I have owned that got better every winter.', who: 'Inès Carvalho', role: 'Client since 2019' },
		steps: [
			{ title: 'Consultation', body: 'We talk about how you live, then take eleven measurements.' },
			{ title: 'Toile', body: 'A muslin fitting shows the line before any wool is cut.' },
			{ title: 'Finishing', body: 'Hand-finished buttonholes, linings and a final adjustment at the bench.' }
		],
		gallery: ['Overcoat, camel', 'Knit no. 4', 'Atelier, Lyon', 'Silk twill'],
		closing: { title: 'By appointment.', sub: 'Fittings in Lyon, Paris and online.', button: 'Request an appointment' },
		footer: 'Maison Verlaine, rue des Capucins 14, Lyon.',
		items: [
			{ name: 'Overcoat, Merino', meta: 'Camel · 46–56', price: '€1,850' },
			{ name: 'Knit no. 4', meta: 'Natural · S–XL', price: '€420' },
			{ name: 'Pleated trouser', meta: 'Charcoal · 44–54', price: '€390' },
			{ name: 'Washed silk shirt', meta: 'Ivory · XS–L', price: '€310' },
			{ name: 'Satchel', meta: 'Tan · one size', price: '€640' },
			{ name: 'Scarf', meta: 'Oxblood · 180 cm', price: '€160' }
		],
		ticker: ['made in lyon', 'a/w 2026', 'cut by hand', 'repaired for life', 'undyed wool', 'by appointment']
	},
	{
		id: 'studio',
		name: 'Design studio',
		brand: 'Field & Form',
		mark: 'F&F',
		nav: ['Work', 'Studio', 'Journal', 'Contact'],
		eyebrow: 'Identity and exhibition design',
		title: 'We design for rooms people walk into.',
		hl: 'walk into',
		sub: 'A nine-person studio in Rotterdam making identities, wayfinding and exhibitions for museums, theatres and cities.',
		cta: 'See our work',
		cta2: 'Start a project',
		features: [
			{ title: 'Kunsthal Rotterdam', body: 'A flexible identity for 40 exhibitions a year, built on one typeface and three grids.', tag: 'Identity' },
			{ title: 'Stadsarchief', body: 'Wayfinding for a 1930s building: signage that reads as part of the architecture.', tag: 'Wayfinding' },
			{ title: 'Noord Festival', body: 'Posters, programmes and a five-day street takeover for 28,000 visitors.', tag: 'Campaign' },
			{ title: 'Delft Ceramics', body: 'A museum redesign across 600 objects, with labels people actually read.', tag: 'Exhibition' },
			{ title: 'Veld Magazine', body: 'Quarterly editorial design: seven issues, one typeface, nothing repeated.', tag: 'Editorial' },
			{ title: 'City of Utrecht', body: 'A public-facing system for forms, letters and buses.', tag: 'Systems' }
		],
		stats: [
			{ v: '19', l: 'years in practice' },
			{ v: '210', l: 'projects shipped' },
			{ v: '6', l: 'D&AD pencils' }
		],
		quote: { text: 'They asked what the room needed before they asked what we wanted. That order matters.', who: 'Pieter van Dalen', role: 'Director, Stadsarchief' },
		steps: [
			{ title: 'Listen', body: 'Two weeks of site visits, interviews and a long look at what already works.' },
			{ title: 'Draw', body: 'Three routes on paper and in the room at full scale, not on screens.' },
			{ title: 'Build', body: 'We stay through fabrication, installation and the first month of use.' }
		],
		gallery: ['Kunsthal, signage', 'Noord, poster wall', 'Veld no. 7', 'Delft labels'],
		closing: { title: 'Have a room in mind?', sub: 'We take on six new projects a year.', button: 'Write to the studio' },
		footer: 'Field & Form, Wilhelminakade 91, Rotterdam.',
		items: [
			{ name: 'Kunsthal Rotterdam', meta: 'Identity · 2025', price: 'Case study' },
			{ name: 'Stadsarchief', meta: 'Wayfinding · 2024', price: 'Case study' },
			{ name: 'Noord Festival', meta: 'Campaign · 2024', price: 'Case study' },
			{ name: 'Delft Ceramics', meta: 'Exhibition · 2023', price: 'Case study' },
			{ name: 'Veld Magazine', meta: 'Editorial · 2022', price: 'Case study' },
			{ name: 'City of Utrecht', meta: 'Systems · 2021', price: 'Case study' }
		],
		ticker: ['identity', 'wayfinding', 'exhibitions', 'editorial', 'rotterdam', 'six projects a year']
	},
	{
		id: 'kitchen',
		name: 'Restaurant',
		brand: 'Oriel',
		mark: 'O',
		nav: ['Menu', 'Wine', 'Reserve', 'Visit'],
		eyebrow: 'Seasonal kitchen · Lisbon',
		title: 'Dinner follows the tide and the market.',
		hl: 'tide and the market',
		sub: 'Twenty-eight seats, one tasting menu that changes with what the boats and the Campo de Ourique farmers bring in each morning.',
		cta: 'Reserve a table',
		cta2: 'Read the menu',
		features: [
			{ title: 'Razor clam, brown butter', body: 'Taken off the Sado estuary at dawn, finished with lemon leaf and sourdough crumb.', tag: 'First' },
			{ title: 'Bean and chard', body: 'Slow white beans, wilted chard, a spoon of last year’s preserved lemon.', tag: 'Second' },
			{ title: 'Black pork, fennel', body: 'From a family in Alentejo, rested for a week, with fennel three ways.', tag: 'Main' },
			{ title: 'Burnt cheese tart', body: 'Serra da Estrela sheep’s cheese, quince, a little sea salt.', tag: 'Pudding' },
			{ title: 'Natural wine', body: 'Forty bottles from small Portuguese growers; four by the glass.', tag: 'Drink' },
			{ title: 'The counter', body: 'Eight seats facing the pass, walk-ins only after nine.', tag: 'Seats' }
		],
		stats: [
			{ v: '28', l: 'seats' },
			{ v: '7', l: 'courses, nightly' },
			{ v: '€78', l: 'tasting menu' }
		],
		quote: { text: 'The best meal I had in Portugal, and nobody once explained the concept.', who: 'Tom Alvarez', role: 'Guest, October' },
		steps: [
			{ title: 'Morning', body: 'We buy at the market from nine and write the menu by eleven.' },
			{ title: 'Afternoon', body: 'Bread, stocks and preserves; the kitchen smells of smoke.' },
			{ title: 'Evening', body: 'Doors at seven. Courses arrive when they are ready, not on a clock.' }
		],
		gallery: ['The pass', 'Razor clams', 'Counter seats', 'Burnt tart'],
		closing: { title: 'Tables open sixty days ahead.', sub: 'Tuesday to Saturday, from seven.', button: 'Reserve' },
		footer: 'Oriel, Rua Domingos Sequeira 31, Lisbon.',
		items: [
			{ name: 'Razor clam, brown butter', meta: 'lemon leaf, sourdough', price: '—' },
			{ name: 'Bean and chard', meta: 'preserved lemon', price: '—' },
			{ name: 'Grilled octopus', meta: 'smoked paprika, potato', price: '—' },
			{ name: 'Black pork, fennel', meta: 'three ways', price: '—' },
			{ name: 'Burnt cheese tart', meta: 'quince, sea salt', price: '—' },
			{ name: 'Tasting menu', meta: '7 courses', price: '€78' }
		],
		ticker: ['tuesday to saturday', 'doors at seven', 'natural wine', 'bought this morning', '28 seats', 'lisbon']
	},
	{
		id: 'observatory',
		name: 'Research institute',
		brand: 'Halden Institute',
		mark: 'H',
		nav: ['Research', 'Data', 'Publications', 'Careers'],
		eyebrow: 'Climate and ocean data',
		title: 'Measuring change where it is slowest to see.',
		hl: 'slowest to see',
		sub: 'Open, citable observations of sea temperature, ice cover and carbon uptake across the North Atlantic, updated every six hours.',
		cta: 'Explore the data',
		cta2: 'Read the latest paper',
		features: [
			{ title: 'Sea surface, 1982–today', body: 'Daily 0.05° grids, with uncertainty bands and a documented method.', tag: 'Dataset' },
			{ title: 'Arctic ice edge', body: 'Weekly extent from passive microwave, with a downloadable shapefile.', tag: 'Dataset' },
			{ title: 'Carbon uptake', body: 'Ship-of-opportunity measurements assembled into monthly basin estimates.', tag: 'Dataset' },
			{ title: 'API and bulk download', body: 'Every dataset is available as NetCDF, CSV and over a REST API.', tag: 'Access' },
			{ title: 'Method notes', body: 'Each series has a versioned method and a changelog written for non-specialists.', tag: 'Docs' },
			{ title: 'Teaching kits', body: 'Classroom exercises built on real data, with worked solutions.', tag: 'Education' }
		],
		stats: [
			{ v: '+0.74°C', l: 'North Atlantic since 1982' },
			{ v: '41 yrs', l: 'continuous record' },
			{ v: '1.8M', l: 'downloads last year' }
		],
		quote: { text: 'The only archive where I can trace every number back to the instrument that produced it.', who: 'Dr Lena Brandt', role: 'Physical oceanographer, Kiel' },
		steps: [
			{ title: 'Observe', body: 'Buoys, ships and satellites report every six hours.' },
			{ title: 'Check', body: 'Automated tests, then a human review of every flagged series.' },
			{ title: 'Publish', body: 'Versioned, citable, free to use with attribution.' }
		],
		gallery: ['Sea surface anomaly', 'Ice edge, March', 'Mooring A4', 'Basin carbon'],
		closing: { title: 'Use the data. Cite it. Tell us what breaks.', sub: 'Every release is archived with a DOI.', button: 'Browse datasets' },
		footer: 'Halden Institute, Tromsø.',
		items: [
			{ name: 'SST-NA v4.2', meta: 'daily · 0.05° · 1982–', price: '82 GB' },
			{ name: 'ICE-EDGE v2.1', meta: 'weekly · 1979–', price: '1.4 GB' },
			{ name: 'CARBON-BASIN v1.6', meta: 'monthly · 2004–', price: '310 MB' },
			{ name: 'SALINITY v3.0', meta: 'daily · 1°', price: '14 GB' },
			{ name: 'MOORING-A4', meta: 'hourly · 2011–', price: '2.1 GB' },
			{ name: 'WAVE-HEIGHT v1.1', meta: '3-hourly · 0.25°', price: '46 GB' }
		],
		ticker: ['open data', 'doi on every release', 'updated every six hours', 'netcdf', 'north atlantic', 'since 1982']
	},
	{
		id: 'kids',
		name: 'Children’s learning',
		brand: 'Pip & Pebble',
		mark: 'P',
		nav: ['Play', 'Learn', 'Parents', 'Schools'],
		eyebrow: 'Learning through play · ages 4–8',
		title: 'Today we are building a volcano!',
		hl: 'volcano',
		sub: 'Hundreds of small, safe, screen-light activities that turn the kitchen floor into a science lab, a story corner or a very loud orchestra.',
		cta: 'Start playing',
		cta2: 'For parents',
		features: [
			{ title: 'Kitchen science', body: 'Fizzing, floating and melting with things you already have in the cupboard.', tag: 'Science' },
			{ title: 'Story builders', body: 'Draw three cards, make up a story, and record it with your own voice.', tag: 'Stories' },
			{ title: 'Number games', body: 'Counting, sharing and measuring with real objects, not worksheets.', tag: 'Maths' },
			{ title: 'Make and move', body: 'Dance cards, obstacle courses and clap-along rhythms.', tag: 'Body' },
			{ title: 'Quiet corner', body: 'Calm breathing games for bedtime and big feelings.', tag: 'Feelings' },
			{ title: 'Grown-up guide', body: 'Plain-language notes on what each activity teaches.', tag: 'Parents' }
		],
		stats: [
			{ v: '400+', l: 'activities' },
			{ v: '15 min', l: 'average play' },
			{ v: '0', l: 'ads, ever' }
		],
		quote: { text: 'She asked to do “the volcano one” again before breakfast. That has never happened with a worksheet.', who: 'Dani Okafor', role: 'Parent of a six-year-old' },
		steps: [
			{ title: 'Pick a card', body: 'Choose an activity that fits the time and the mess you are happy with.' },
			{ title: 'Play together', body: 'Short, clear steps; no reading needed for the grown-up.' },
			{ title: 'Share a sticker', body: 'Every finished activity earns a sticker for the wall chart.' }
		],
		gallery: ['Volcano day', 'Story cards', 'Rain-band', 'Sticker wall'],
		closing: { title: 'What shall we make today?', sub: 'The first fifty activities are free.', button: 'Pick an activity' },
		footer: 'Pip & Pebble, made with teachers and toddlers.',
		items: [
			{ name: 'Baking-soda volcano', meta: 'ages 4+ · 20 min', price: 'Science' },
			{ name: 'Three-card stories', meta: 'ages 5+ · 15 min', price: 'Stories' },
			{ name: 'Shoe-box shop', meta: 'ages 6+ · 30 min', price: 'Maths' },
			{ name: 'Rain band', meta: 'ages 4+ · 10 min', price: 'Music' },
			{ name: 'Balloon breathing', meta: 'ages 4+ · 5 min', price: 'Feelings' },
			{ name: 'Sock puppets', meta: 'ages 5+ · 25 min', price: 'Make' }
		],
		ticker: ['ages 4 to 8', 'no ads', 'mess is welcome', 'play together', 'made with teachers', 'free to start']
	},
	{
		id: 'athletic',
		name: 'Running club',
		brand: 'Northbound',
		mark: 'N',
		nav: ['Sessions', 'Races', 'Join', 'Shop'],
		eyebrow: 'Run club · Manchester',
		title: 'Show up. Run further than yesterday.',
		hl: 'further than yesterday',
		sub: 'Six sessions a week on the canal, the hills and the track. Every pace welcome, nobody gets left behind, and the coffee is on us.',
		cta: 'Join a session',
		cta2: 'View the timetable',
		features: [
			{ title: 'Tuesday track', body: 'Intervals at Wythenshawe, 6:45 pm. Three pace groups, one finish line.', tag: 'Speed' },
			{ title: 'Thursday hills', body: 'Eight kilometres around Heaton Park with a proper climb in the middle.', tag: 'Strength' },
			{ title: 'Saturday long run', body: 'Canal to Sale and back, 10 to 24 km, with a coffee van at the turn.', tag: 'Endurance' },
			{ title: 'Beginner course', body: 'Zero to 5K in eight weeks, in a group that does not mind walking.', tag: 'Start' },
			{ title: 'Race squad', body: 'Marathon and half preparation, pacers and a plan you can follow.', tag: 'Compete' },
			{ title: 'Recovery', body: 'Mobility, strength and a Sunday shake-out for tired legs.', tag: 'Rest' }
		],
		stats: [
			{ v: '1,240', l: 'members' },
			{ v: '6', l: 'sessions a week' },
			{ v: '3:07', l: 'club marathon record' }
		],
		quote: { text: 'I joined to lose a stone. I stayed because someone waited for me at the top of the hill.', who: 'Ravi Mistry', role: 'Member since 2022' },
		steps: [
			{ title: 'Come along', body: 'Turn up ten minutes early. Your first session is free.' },
			{ title: 'Find your group', body: 'Leaders match you to a pace; you can move up or down any week.' },
			{ title: 'Keep going', body: 'Streaks, badges and a Saturday coffee make showing up the easy part.' }
		],
		gallery: ['Tuesday track', 'Heaton hills', 'Canal long run', 'Race day'],
		closing: { title: 'See you Tuesday, 6:45.', sub: 'Wythenshawe Park track. Bring water.', button: 'Book your free session' },
		footer: 'Northbound Run Club, Manchester.',
		items: [
			{ name: 'Tuesday track', meta: '6:45 pm · Wythenshawe', price: 'All paces' },
			{ name: 'Thursday hills', meta: '6:30 pm · Heaton Park', price: 'All paces' },
			{ name: 'Saturday long run', meta: '8:00 am · Castlefield', price: '10–24 km' },
			{ name: 'Beginners 5K', meta: 'Sundays · 8 weeks', price: '£40' },
			{ name: 'Race squad', meta: 'Mon / Wed', price: '£15 / mo' },
			{ name: 'Shake-out', meta: 'Sunday · 9 am', price: 'Free' }
		],
		ticker: ['all paces welcome', 'tuesday 6:45', 'nobody left behind', 'coffee on us', 'sub-3:07', 'north of everywhere']
	},
	{
		id: 'product',
		name: 'Hardware product',
		brand: 'Lumen One',
		mark: 'L1',
		nav: ['Product', 'Specs', 'Reviews', 'Support'],
		eyebrow: 'Desk lamp · Gen 2',
		title: 'Light that follows the hour.',
		hl: 'follows the hour',
		sub: 'A desk lamp that moves from 2,700 K at dusk to 5,500 K at midday on its own, with one ring to turn and no app to open.',
		cta: 'Order for £149',
		cta2: 'See the specs',
		features: [
			{ title: 'Circadian curve', body: 'Colour temperature follows sunrise and sunset in your city, set in a single turn of the ring.', tag: 'Light' },
			{ title: 'CRI 97', body: 'Colours look like they do outside, whether you are drawing or reading.', tag: 'Quality' },
			{ title: 'Aluminium body', body: 'Milled from one block, with a weighted base that stays where you put it.', tag: 'Build' },
			{ title: 'Touch ring', body: 'Brightness and warmth in one gesture; nothing else to learn.', tag: 'Control' },
			{ title: 'Repairable', body: 'Every part is replaceable with a screwdriver. Spares for ten years.', tag: 'Repair' },
			{ title: 'Quiet power', body: '9 W at full brightness, and no flicker you can see or film.', tag: 'Power' }
		],
		stats: [
			{ v: '97', l: 'CRI' },
			{ v: '2,700–5,500 K', l: 'range' },
			{ v: '10 yrs', l: 'spares promised' }
		],
		quote: { text: 'I stopped squinting at four in the afternoon. I did not know that was the lamp.', who: 'Hannah Weiss', role: 'Illustrator' },
		steps: [
			{ title: 'Plug it in', body: 'USB-C, any charger. No hub, no app, no account.' },
			{ title: 'Pick your city', body: 'Turn the ring to your time zone once; the lamp does the rest.' },
			{ title: 'Forget about it', body: 'It dims toward evening, so you do not have to.' }
		],
		gallery: ['Lumen One, brass', 'Ring detail', 'In the studio', 'Spare parts'],
		closing: { title: 'Ships in three days.', sub: '30-day returns, ten-year spares.', button: 'Order Lumen One' },
		footer: 'Lumen, designed in Copenhagen.',
		items: [
			{ name: 'Lumen One, brass', meta: 'Aluminium · 640 g', price: '£149' },
			{ name: 'Lumen One, graphite', meta: 'Aluminium · 640 g', price: '£149' },
			{ name: 'Clamp mount', meta: 'Fits 5–60 mm', price: '£24' },
			{ name: 'Replacement ring', meta: 'Touch module', price: '£18' },
			{ name: 'Travel sleeve', meta: 'Wool felt', price: '£22' },
			{ name: 'Lumen One Pair', meta: 'Two lamps', price: '£279' }
		],
		ticker: ['cri 97', 'no app', 'follows the sun', 'repairable', 'ten years of spares', 'copenhagen']
	}
];

export const SUBJECT_BY_ID = Object.fromEntries(SUBJECTS.map((s) => [s.id, s])) as Record<string, Subject>;
