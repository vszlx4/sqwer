import type { CSSProperties } from 'react';

// The six game previews, ported from the stable site's landing page (apps/web +page.svelte): the same markup and
// the same animations, recoloured with the current accent. Decorative; the game name and text sit beside them.

const n = (i: number) => ({ ['--n' as string]: i }) as CSSProperties;

export type GameKind = 'falling' | 'words' | 'listen' | 'keyhunt' | 'race' | 'echo';

export function GamePreview({ kind }: { kind: GameKind }) {
	return (
		<div className={`preview p-${kind}`} aria-hidden="true">
			{kind === 'falling' && (
				<>
					{['f', 'j', 'k', 'd', 'g'].map((l, i) => (
						<span key={l} className="fl" style={{ left: `${10 + i * 19}%`, ...n(i) }}>{l}</span>
					))}
					<span className="pop" />
					<span className="floor" />
				</>
			)}
			{kind === 'words' && (
				<>
					{['steady', 'hand', 'river', 'quiet'].map((w, i) => (
						<span key={w} className="fl fw" style={{ left: `${6 + i * 23}%`, ...n(i) }}>{w}</span>
					))}
					<span className="floor" />
				</>
			)}
			{kind === 'listen' && (
				<>
					<span className="speaker">
						<span className="wave">{[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => <span key={i} style={n(i)} />)}</span>
					</span>
					<span className="typed">
						steady<span className="caret" />
					</span>
				</>
			)}
			{kind === 'keyhunt' && (
				<>
					<span className="mini-kb">
						{['qwertyuiop', 'asdfghjkl', 'zxcvbnm'].map((row, r) => (
							<span key={row} className="kb-row" style={{ ['--r' as string]: r } as CSSProperties}>
								{[...row].map((k) => <span key={k} className={`mk ${k === 'j' ? 'target' : ''}`}>{k}</span>)}
							</span>
						))}
					</span>
					<span className="fuse" />
				</>
			)}
			{kind === 'race' && (
				<>
					{['me', 'pace'].map((who) => (
						<span key={who} className="race-lane">
							<span className={`trail ${who}`} />
							<span className={`runner ${who}`} />
							<span className="flag" />
						</span>
					))}
					<span className="race-text">
						the quick <b>r</b>
						<span>ace</span>
					</span>
				</>
			)}
			{kind === 'echo' && (
				<>
					<span className="echo-label">Watch, then repeat</span>
					<span className="echo-row">
						{['s', 'k', 'd', 'l'].map((k, i) => <span key={i} className="ek" style={n(i)}>{k}</span>)}
					</span>
				</>
			)}
		</div>
	);
}
