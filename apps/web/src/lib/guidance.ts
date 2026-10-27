export interface ResultSummary {
	wpm: number;
	raw: number;
	accuracy: number;
	consistency: number;
}

/** Factual notes on a result; no praise. Next step comes from the learner path. */
export function guidance(r: ResultSummary, ctx: { previousBest: number | null }): string[] {
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
		insights.push(`Consistency was ${Math.round(r.consistency)}%, which indicates alternating bursts and pauses rather than an even pace.`);
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

	return insights;
}
