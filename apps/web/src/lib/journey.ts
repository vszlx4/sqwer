import type { FingerProfile } from '@sqwer/fingermap';
import { ASSESSMENT_COVERAGE } from './exams.ts';
import type { ResultRecord } from './results/types.ts';

export type StepStatus = 'complete' | 'current' | 'in-progress' | 'locked';

export interface JourneyStep {
	id: string;
	title: string;
	why: string;
	learn: string;
	status: StepStatus;
	detail: string | null;
	href: string;
	action: string;
	requirement?: string;
}

export function buildJourney(results: ResultRecord[], profile: FingerProfile): JourneyStep[] {
	const placements = results.filter((r) => r.exam === 'placement');
	const assessments = results.filter((r) => r.exam === 'finger-speed');
	const coverage = profile.core.mapped / profile.core.total;
	const lastPlacement = placements[placements.length - 1];
	const firstPlacement = placements[0];

	const step1: StepStatus = placements.length ? 'complete' : 'current';
	const step2: StepStatus =
		coverage >= ASSESSMENT_COVERAGE ? 'complete' : profile.samples > 0 ? 'in-progress' : placements.length ? 'current' : 'locked';
	const step3: StepStatus = assessments.length ? 'complete' : coverage >= ASSESSMENT_COVERAGE ? 'current' : 'locked';
	const step4: StepStatus = placements.length >= 2 ? 'complete' : assessments.length ? 'current' : 'locked';

	const change =
		firstPlacement && lastPlacement && placements.length >= 2 ? Math.round(lastPlacement.wpm - firstPlacement.wpm) : null;

	return [
		{
			id: 'placement',
			title: 'Establish your baseline',
			why: 'A one-minute placement test records your current speed and accuracy. Every later result is compared with it.',
			learn: 'Your starting speed, your accuracy and how evenly you type.',
			status: step1,
			detail: lastPlacement ? `${Math.round(lastPlacement.wpm)} WPM at ${Math.round(lastPlacement.accuracy)}% accuracy` : null,
			href: '/test?exam=placement',
			action: placements.length ? 'Retake the placement test' : 'Take the placement test'
		},
		{
			id: 'finger-map',
			title: 'Map your technique',
			why: 'Most typists depart from standard fingering in places. Recording which finger you use for each key reveals those habits.',
			learn: 'Which keys you type with a non-standard finger, and habits that depend on the neighbouring keys.',
			status: step2,
			detail: profile.samples ? `${Math.round(coverage * 100)}% of core keys mapped` : null,
			href: profile.samples ? '/map' : '/map/session',
			action: profile.samples ? 'Continue mapping' : 'Start mapping',
			requirement: 'Complete the placement test first, or begin mapping at any time.'
		},
		{
			id: 'finger-speed',
			title: 'Assess each finger',
			why: 'Overall speed hides weak fingers. This assessment measures the speed and accuracy of each finger separately.',
			learn: 'Your fastest and slowest fingers, and where errors originate.',
			status: step3,
			detail: assessments.length
				? `Average ${Math.round(assessments[assessments.length - 1]!.wpm)} WPM across all fingers`
				: null,
			href: '/exams/finger-speed',
			action: assessments.length ? 'Retake the assessment' : 'Begin the assessment',
			requirement: `Available once ${Math.round(ASSESSMENT_COVERAGE * 100)}% of core keys are mapped.`
		},
		{
			id: 'progress',
			title: 'Measure your progress',
			why: 'After practising, retake the placement test under the same conditions to see what has changed.',
			learn: 'How your speed and accuracy have developed since your baseline.',
			status: step4,
			detail: change !== null ? `${change >= 0 ? '+' : ''}${change} WPM since your first placement test` : null,
			href: '/test?exam=placement',
			action: 'Retake the placement test',
			requirement: 'Available after the finger assessment.'
		}
	];
}
