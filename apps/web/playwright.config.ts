import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	timeout: 90_000,
	webServer: {
		command: 'rm -rf .data-e2e && PUBLIC_SITE_URL=http://localhost:4321 npm run build && SQWER_DATA_DIR=.data-e2e PUBLIC_SITE_URL=http://localhost:4321 BODY_SIZE_LIMIT=6M PORT=4321 node build',
		port: 4321,
		reuseExistingServer: false,
		timeout: 120_000
	},
	use: { baseURL: 'http://localhost:4321' },
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}
			}
		}
	]
});
