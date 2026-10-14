import { ASSESSMENT_COVERAGE } from './exams.ts';

export interface Guidance {
	insights: string[];
	next: { title: string; text: string; href: string; action: string };
}

export interface ResultSummary {
	wpm: number;
	raw: number;
	accuracy: number;
	consistency: number;
}

/**
 * Factual observations about a result and the recommended next step in the
 * journey. Statements describe the numbers; they do not praise or encourage.
 */
export function guidance(
	r: ResultSummary,
	ctx: { coverage: number; hasPlacement: boolean; hasAssessment: boolean; previousBest: number | null }
): Guidance {
	const insights: string[] = [];
	const errorCost = r.raw - r.wpm;

	if (r.accuracy < 95) {
		insights.push(
			`Accuracy was ${Math.round(r.accuracy)}%. Below 95%, errors and their corrections usually cost more time than typing slightly more slowly.`
		);
	} else {
		insights.push(`Accuracy was ${Math.round(r.accuracy)}%.`);
	}
	if (errorCost >= 1) {
		insights.push(`Errors reduced net speed by ${Math.round(errorCost)} WPM (raw speed ${Math.round(r.raw)} WPM, net speed ${Math.round(r.wpm)} WPM).`);
	}
	if (r.consistency < 70) {
		insights.push(`Consistency was ${Math.round(r.consistency)}%, which indicates alternating bursts and pauses rather than an even rhythm.`);
	} else {
		insights.push(`Consistency was ${Math.round(r.consistency)}%.`);
	}
	if (ctx.previousBest !== null) {
		const diff = r.wpm - ctx.previousBest;
		insights.push(
			diff > 0
				? `This is ${Math.round(diff)} WPM above your previous best in this examination (${Math.round(ctx.previousBest)} WPM).`
				: `Your best in this examination remains ${Math.round(ctx.previousBest)} WPM.`
		);
	}

	let next: Guidance['next'];
	if (!ctx.hasPlacement) {
		next = {
			title: 'Establish your baseline',
			text: 'Take the one-minute placement test so that future results can be compared with a fixed reference.',
			href: '/test?exam=placement',
			action: 'Take the placement test'
		};
	} else if (ctx.coverage < ASSESSMENT_COVERAGE) {
		next = {
			title: 'Map your technique',
			text: 'Record which finger you use for each key. This shows habits that a speed test alone cannot show.',
			href: ctx.coverage > 0 ? '/map' : '/map/session',
			action: ctx.coverage > 0 ? 'Continue mapping' : 'Start mapping'
		};
	} else if (!ctx.hasAssessment) {
		next = {
			title: 'Assess each finger',
			text: 'Your finger map is ready. Measure the speed and accuracy of each finger to find where practice is needed.',
			href: '/exams/finger-speed',
			action: 'Begin the finger assessment'
		};
	} else {
		next = {
			title: 'Track your progress',
			text: 'Retake the placement test after practising to measure the change since your baseline.',
			href: '/journey',
			action: 'View your journey'
		};
	}
	return { insights, next };
}
