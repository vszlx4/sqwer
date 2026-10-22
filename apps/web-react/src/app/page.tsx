import { LogoWordmark } from '@/components/brand/LogoWordmark';

export default function Home() {
	return (
		<main id="content" className="mx-auto grid min-h-dvh w-full max-w-[1180px] content-center gap-6 px-[clamp(16px,4vw,40px)]">
			<LogoWordmark className="h-[26px] w-auto text-ink" />
			<h1 className="text-[clamp(40px,5vw,72px)] leading-none tracking-[-0.025em]">The React rewrite starts here.</h1>
		</main>
	);
}
