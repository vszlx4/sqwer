// Turns a DesignSpec into CSS custom properties, exportable CSS, design tokens and a component configuration.

import type { CSSProperties } from 'react';
import { SUBJECT_BY_ID } from './content';
import { TYPE_BY_ID } from './fonts';
import { EASES, SHADOWS } from './options';
import { optionName } from './dims';
import { contrast } from './color';
import { resolveScheme } from './palettes';
import type { DesignSpec } from './types';

const num = (n: number, d = 3) => String(Math.round(n * 10 ** d) / 10 ** d);

export function specVars(spec: DesignSpec): Record<string, string> {
	const s = resolveScheme(spec.palette, spec.mode, spec.custom);
	const t = TYPE_BY_ID[spec.type] ?? TYPE_BY_ID['altera-neue'];
	const ease = EASES.find((e) => e.id === spec.ease)?.css ?? EASES[0].css;
	const shadow = SHADOWS.find((x) => x.id === spec.shadow)?.css ?? 'none';
	return {
		'--bg': s.bg,
		'--surface': s.surface,
		'--surface-2': s.surface2,
		'--ink': s.ink,
		'--ink-2': s.ink2,
		'--line': s.line,
		'--accent': s.accent,
		'--accent-2': s.accent2,
		'--on-accent': s.onAccent,
		'--f-display': t.display,
		'--f-body': t.body,
		'--f-mono': t.mono,
		'--w-display': String(t.dw),
		'--w-body': String(t.bw),
		'--tr': `${num(t.tr + spec.tracking)}em`,
		'--case': t.caseD,
		'--ital': t.italic ? 'italic' : 'normal',
		'--lh': String(t.lh),
		'--hero': String(t.hero * spec.scale),
		'--scale': String(spec.scale),
		'--radius': `${num(spec.radius, 1)}px`,
		'--radius-lg': `${num(spec.radius * 1.7, 1)}px`,
		'--radius-sm': `${num(spec.radius * 0.5, 1)}px`,
		'--bw': `${num(spec.border, 1)}px`,
		'--bc': spec.border >= 2 ? s.ink : s.line,
		'--shadow': shadow,
		'--dens': String(spec.density),
		'--dur': `${num(spec.dur)}s`,
		'--ease': ease,
		'--stag': `${num(spec.stagger)}s`,
		'--maxw': `${spec.width}px`,
		'--bgi': String(spec.bgI),
		'--angle': `${spec.angle}deg`
	};
}

export const specStyle = (spec: DesignSpec): CSSProperties => ({ ...specVars(spec), colorScheme: spec.mode }) as CSSProperties;

export function specCss(spec: DesignSpec, selector = ':root'): string {
	const v = specVars(spec);
	const lines = Object.entries(v).map(([k, val]) => `  ${k}: ${val};`);
	return `/* ${spec.name} · ${spec.mode} */\n${selector} {\n${lines.join('\n')}\n  color-scheme: ${spec.mode};\n}\n`;
}

export function specTokens(spec: DesignSpec) {
	const v = specVars(spec);
	const c = (k: string) => ({ $type: 'color', $value: v[k] });
	return {
		$description: `${spec.name}: exported from the Atlas design lab`,
		color: { bg: c('--bg'), surface: c('--surface'), 'surface-2': c('--surface-2'), ink: c('--ink'), 'ink-2': c('--ink-2'), line: c('--line'), accent: c('--accent'), 'accent-2': c('--accent-2'), 'on-accent': c('--on-accent') },
		font: {
			display: { $type: 'fontFamily', $value: v['--f-display'] },
			body: { $type: 'fontFamily', $value: v['--f-body'] },
			mono: { $type: 'fontFamily', $value: v['--f-mono'] },
			'display-weight': { $type: 'fontWeight', $value: Number(v['--w-display']) },
			'display-tracking': { $type: 'dimension', $value: v['--tr'] }
		},
		size: { 'type-scale': { $type: 'number', $value: spec.scale }, density: { $type: 'number', $value: spec.density }, 'page-width': { $type: 'dimension', $value: `${spec.width}px` } },
		shape: { radius: { $type: 'dimension', $value: v['--radius'] }, border: { $type: 'dimension', $value: v['--bw'] }, shadow: { $type: 'shadow', $value: v['--shadow'] } },
		motion: { duration: { $type: 'duration', $value: v['--dur'] }, stagger: { $type: 'duration', $value: v['--stag'] }, easing: { $type: 'cubicBezier', $value: v['--ease'] }, reveal: { $type: 'string', $value: spec.reveal } }
	};
}

export function specComponents(spec: DesignSpec) {
	const label = (k: keyof DesignSpec) => optionName(k, spec[k] as string);
	return {
		name: spec.name,
		basedOn: spec.world,
		content: SUBJECT_BY_ID[spec.subject]?.name,
		hero: label('layout'),
		sections: label('features'),
		navigation: label('nav'),
		button: label('button'),
		card: label('card'),
		input: label('input'),
		hover: label('hover'),
		illustration: label('art'),
		imageTreatment: label('treat'),
		background: { kind: label('bg'), intensity: spec.bgI, angle: spec.angle, texture: label('surface') },
		palette: { name: spec.palette === 'custom' ? 'Custom' : label('palette'), mode: spec.mode },
		type: label('type'),
		motion: { reveal: label('reveal'), easing: label('ease'), duration: spec.dur, stagger: spec.stagger }
	};
}

export function specReport(spec: DesignSpec) {
	const s = resolveScheme(spec.palette, spec.mode, spec.custom);
	return [
		{ name: 'Text on background', ratio: contrast(s.ink, s.bg), need: 4.5 },
		{ name: 'Secondary text on background', ratio: contrast(s.ink2, s.bg), need: 4.5 },
		{ name: 'Text on surface', ratio: contrast(s.ink, s.surface), need: 4.5 },
		{ name: 'Accent on background', ratio: contrast(s.accent, s.bg), need: 3 },
		{ name: 'Label on accent', ratio: contrast(s.onAccent, s.accent), need: 4.5 }
	];
}
