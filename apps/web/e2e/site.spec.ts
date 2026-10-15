import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('home page: one primary action above the fold, leading to getting started', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Learn to type');
	const main = page.getByRole('main');
	// A single, specific primary action; the course is explained on the page itself.
	await expect(main.locator('.btn-primary')).toHaveCount(1);
	const cta = main.getByRole('link', { name: 'Get started' });
	await expect(cta).toBeInViewport();

	await main.getByRole('link', { name: 'See the whole course' }).click();
	await expect(page).toHaveURL(/#road$/);
	await expect(page.getByRole('heading', { name: /One long road/ })).toBeInViewport();

	await cta.click();
	await expect(page).toHaveURL(/\/start$/);
	await expect(page.getByRole('heading', { name: 'How would you describe your typing today?' })).toBeVisible();
});

test('examination cards are single links with a recommended next step', async ({ page }) => {
	await page.goto('/exams');
	const placement = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Placement test' }) });
	await expect(placement.getByText('Recommended')).toBeVisible();
	await expect(placement.getByRole('link')).toHaveCount(1);
	const timed = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Timed test' }) });
	await timed.click({ position: { x: 30, y: 30 } });
	await expect(page).toHaveURL(/\/test\?exam=timed$/);
});

test('the main navigation leads with the course; getting started is not a permanent item', async ({ page }) => {
	await page.goto('/');
	const nav = page.getByRole('navigation', { name: 'Main' }).first();
	await expect(nav.getByRole('link')).toHaveText(['Courses', 'Examinations', 'Finger map', 'History']);
});

for (const [path, heading] of [
	['/about', 'Built around your hands'],
	['/faq', 'Frequently asked questions'],
	['/privacy', 'Privacy Policy'],
	['/terms', 'Terms and Conditions'],
	['/cookies', 'Cookie and Storage Policy'],
	['/legal', 'Legal centre'],
	['/copyright', 'Content and Copyright Policy'],
	['/accessibility', 'Accessibility Statement'],
	['/security', 'Security and Vulnerability Disclosure Policy']
] as const) {
	test(`${path} renders with breadcrumbs, header and footer`, async ({ page }) => {
		await page.goto(path);
		await expect(page.getByRole('heading', { level: 1 })).toContainText(heading);
		await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible();
		await expect(page.getByRole('contentinfo')).toContainText('info@mughram.com');
		await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/);
	});
}

test('unknown pages show the custom 404 page', async ({ page }) => {
	const res = await page.goto('/this-page-does-not-exist');
	expect(res?.status()).toBe(404);
	await expect(page.getByRole('heading', { level: 1 })).toContainText('This page could not be found.');
});

test('security.txt is served in the RFC 9116 format', async ({ request }) => {
	const res = await request.get('/.well-known/security.txt');
	expect(res.status()).toBe(200);
	const text = await res.text();
	expect(text).toContain('Contact: mailto:info@mughram.com');
	expect(Date.parse(text.match(/^Expires: (.+)$/m)![1]!)).toBeGreaterThan(Date.now());
	expect(text).toContain('/security');
});

test('pages are served with a Content Security Policy', async ({ request }) => {
	const res = await request.get('/');
	const csp = res.headers()['content-security-policy'] ?? '';
	expect(csp).toContain("default-src 'self'");
	expect(csp).toContain("frame-ancestors 'none'");
	expect(csp).toMatch(/script-src 'self' 'nonce-/);
});

test('robots.txt and the sitemap are served', async ({ request }) => {
	expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap:');
	expect(await (await request.get('/sitemap.xml')).text()).toContain('<loc>');
});

test('every page has a unique title', async ({ page }) => {
	const titles = new Set<string>();
	const paths = ['/', '/start', '/learn', '/learn/start', '/exams', '/test', '/map', '/about', '/faq', '/legal', '/privacy', '/terms', '/cookies', '/copyright', '/accessibility', '/security', '/signin', '/signup', '/reset-password'];
	for (const path of paths) {
		await page.goto(path);
		await page.waitForFunction(() => document.title.length > 0);
		titles.add(await page.title());
	}
	expect(titles.size).toBe(paths.length);
});

test('mobile: menu navigates and nothing fixed covers the content', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 800 });
	await page.goto('/');
	// Only the header may stay on screen while scrolling.
	const fixed = await page.evaluate(() =>
		[...document.querySelectorAll('body *')].filter((el) => getComputedStyle(el).position === 'fixed' && (el as HTMLElement).offsetHeight > 0).length
	);
	expect(fixed).toBe(0);
	await page.getByRole('button', { name: 'Open menu' }).click();
	await page.locator('#mobile-menu').getByRole('link', { name: 'Finger map' }).click();
	await expect(page).toHaveURL(/\/map$/);
});

for (const scheme of ['light', 'dark'] as const) {
	test(`accessibility audit passes in the ${scheme} theme`, async ({ browser }) => {
		const context = await browser.newContext({ colorScheme: scheme });
		const page = await context.newPage();
		const failures: string[] = [];
		for (const path of ['/', '/start', '/learn', '/learn/start', '/learn/l01', '/learn/l05', '/exams', '/exams/finger-speed', '/test?exam=placement', '/map', '/history', '/about', '/faq', '/legal', '/privacy', '/terms', '/cookies', '/copyright', '/accessibility', '/security', '/signin', '/signup', '/reset-password', '/missing']) {
			await page.goto(path);
			await page.waitForTimeout(300);
			// Measure the settled page: entrance animations fade content in over a moment.
			await page.waitForFunction(() =>
				document.getAnimations().every((a) => a.effect?.getTiming().iterations === Infinity || a.playState !== 'running')
			);
			const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
			for (const v of results.violations) {
				failures.push(`${path}: ${v.id} — ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`);
			}
		}
		await context.close();
		expect(failures).toEqual([]);
	});
}
