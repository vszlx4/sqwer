import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import type { Destination } from '@/lib/links';

// The action hierarchy from DESIGN_GUIDE.md section 7: one primary per region, secondary
// alternatives, danger only behind a confirmation.

type Variant = 'primary' | 'secondary' | 'danger';
type Size = 'md' | 'lg';

const base =
	'group inline-flex items-center justify-center gap-2 rounded border font-semibold whitespace-nowrap no-underline transition-[background-color,border-color,filter,transform] duration-[140ms] active:translate-y-px active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-55';

const variants: Record<Variant, string> = {
	primary: 'border-transparent bg-accent text-on-accent hover:brightness-[0.94]',
	secondary: 'border-line-strong bg-surface text-ink hover:border-ink-3 hover:bg-surface-2',
	danger: 'border-transparent bg-error text-white hover:brightness-[0.94]'
};

const sizes: Record<Size, string> = {
	md: 'min-h-11 px-[18px] text-[15px]',
	lg: 'min-h-13 px-6 text-base'
};

export function buttonClass(variant: Variant = 'secondary', size: Size = 'md', className = '') {
	return `${base} ${variants[variant]} ${sizes[size]} ${className}`;
}

/** Arrow that nudges 3px right on hover. */
export function ArrowIcon() {
	return (
		<svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform duration-[180ms] group-hover:translate-x-[3px]">
			<path d="M5 12h14M13 6l6 6-6 6" />
		</svg>
	);
}

type ButtonProps = ComponentProps<'button'> & { variant?: Variant; size?: Size };

export function Button({ variant, size, className, type = 'button', ...rest }: ButtonProps) {
	return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}

type ButtonLinkProps = { to: Destination; variant?: Variant; size?: Size; className?: string; children?: ReactNode };

/** A link styled as a button. Unwired destinations render as a dummy link that goes nowhere. */
export function ButtonLink({ to, variant, size, className, children }: ButtonLinkProps) {
	const cls = buttonClass(variant, size, className);
	if (!to.wired) {
		return (
			<a href="#" data-unwired={to.href} className={cls}>
				{children ?? to.label}
			</a>
		);
	}
	return (
		<Link href={to.href} className={cls}>
			{children ?? to.label}
		</Link>
	);
}
