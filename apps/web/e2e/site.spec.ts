import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('home page: headline and calls to action above the fold', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Understand how your hands');
	const cta = page.getByRole('main').getByRole('link', { name: 'Begin your journey' }).first();
	await expect(cta).toBeInViewport();
	await cta.click();
	await expect(page).toHaveURL(/\/journey$/);
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Your learning journey');
});

test('the main navigation leads with the journey, not the speed test', async ({ page }) => {
	await page.goto('/');
	const nav = page.getByRole('navigation', { name: 'Main' }).first();
	await expect(nav.getByRole('link')).toHaveText(['Your journey', 'Examinations', 'Finger map', 'How it works']);
});

for (const [path, heading] of [
	['/about', 'Built around your hands'],
	['/faq', 'Frequently asked questions'],
	['/privacy', 'Privacy Policy'],
	['/terms', 'Terms and Conditions'],
	['/cookies', 'Cookie Policy']
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

test('robots.txt and the sitemap are served', async ({ request }) => {
	expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap:');
	expect(await (await request.get('/sitemap.xml')).text()).toContain('<loc>');
});

test('every page has a unique title', async ({ page }) => {
	const titles = new Set<string>();
	const paths = ['/', '/journey', '/exams', '/test', '/map', '/about', '/faq', '/privacy', '/terms', '/cookies', '/signin', '/signup', '/reset-password'];
	for (const path of paths) {
		await page.goto(path);
		await page.waitForFunction(() => document.title.length > 0);
		titles.add(await page.title());
	}
	expect(titles.size).toBe(paths.length);
});

test('mobile: menu navigates and the sticky call to action is shown', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 800 });
	await page.goto('/');
	await expect(page.locator('.sticky-cta')).toBeVisible();
	await page.getByRole('button', { name: 'Open menu' }).click();
	await page.locator('#mobile-menu').getByRole('link', { name: 'Finger map' }).click();
	await expect(page).toHaveURL(/\/map$/);
});

for (const scheme of ['light', 'dark'] as const) {
	test(`accessibility audit passes in the ${scheme} theme`, async ({ browser }) => {
		const context = await browser.newContext({ colorScheme: scheme });
		const page = await context.newPage();
		const failures: string[] = [];
		for (const path of ['/', '/journey', '/exams', '/exams/finger-speed', '/test?exam=placement', '/map', '/about', '/faq', '/privacy', '/terms', '/cookies', '/signin', '/signup', '/reset-password', '/missing']) {
			await page.goto(path);
			await page.waitForTimeout(300);
			const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
			for (const v of results.violations) {
				failures.push(`${path}: ${v.id} — ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`);
			}
		}
		await context.close();
		expect(failures).toEqual([]);
	});
}
