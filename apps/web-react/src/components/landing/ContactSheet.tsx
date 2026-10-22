import { PART_COLOUR, RANK_AT, course } from './data';
import { Phrase } from './Phrase';

// The course as a photographer's contact sheet: four film strips (the four parts), three frames each (the twelve
// chapters), frame numbers and edge codes on the film, a caption under every frame, and a grease-pencil ring around
// frame 1. Hover or focus a frame to read its summary. The summary is always in the page for assistive technology.

export function ContactSheet() {
	return (
		<div className="sheet" role="group" aria-label={`Contact sheet: ${course.chapters.length} chapters in ${course.parts.length} parts`}>
			<div className="sheet-head" aria-hidden="true">
				<span>sqwer · the course</span>
				<span>{course.chapters.length} frames</span>
				<span>{course.lessons} lessons</span>
			</div>
			{course.parts.map((part, pi) => (
				<div key={part.id} className="strip">
					<p className="strip-title" style={{ color: PART_COLOUR[pi] }}>
						<span aria-hidden="true" style={{ background: PART_COLOUR[pi] }} />
						{part.title}
					</p>
					<div className="film" aria-hidden="true" />
					<ol className="frames">
						{part.chapters.map((num) => {
							const c = course.chapters.find((x) => x.number === num)!;
							const rank = RANK_AT[c.number] ? course.ranks[RANK_AT[c.number] - 1] : null;
							const keys = c.newKeys.filter((k) => k.length === 1);
							const groups = keys.length ? [keys.slice(0, 5).join(''), keys.slice(5, 10).join('')].filter(Boolean) : c.words.slice(0, 3);
							return (
								<li key={num} className="frame" tabIndex={0}>
									<div className="frame-pic">
									<div className="frame-img">
										<span className="frame-n">{c.number}</span>
										<Phrase groups={groups} label={keys.length ? `New keys: ${keys.join(' ')}` : `Practised words: ${groups.join(', ')}`} className="frame-phrase" />
										<p className="frame-sum">{c.summary}</p>
									</div>
									{num === 1 && (
										<span className="grease" aria-hidden="true">
											<svg viewBox="0 0 320 220" preserveAspectRatio="none">
												<ellipse cx="160" cy="110" rx="152" ry="102" transform="rotate(-3 160 110)" fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" strokeDasharray="930 40" vectorEffect="non-scaling-stroke" />
											</svg>
											<em>Start here</em>
										</span>
									)}
									</div>
									<p className="frame-cap">
										<b>{c.title}</b>
										<span>
											{c.lessons.length} lessons{rank ? ` · ${rank.name}` : ''}
										</span>
									</p>
									<span aria-hidden="true" className="frame-code">
										{num}A ▸
									</span>
								</li>
							);
						})}
					</ol>
					<div className="film" aria-hidden="true" />
				</div>
			))}
		</div>
	);
}
