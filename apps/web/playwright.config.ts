import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	timeout: 90_000,
	webServer: {
		command: 'rm -rf .data-e2e && PUBLIC_SITE_URL=http://localhost:4321 npm run build && SQWER_ENV_FILE=none SQWER_DATA_DIR=.data-e2e PUBLIC_SITE_URL=http://localhost:4321 BODY_SIZE_LIMIT=6M ADDRESS_HEADER=x-forwarded-for XFF_DEPTH=1 PORT=4321 node build',
		port: 4321,
		reuseExistingServer: false,
		timeout: 120_000
	},
	// As behind a reverse proxy in production, the client address comes from X-Forwarded-For. Tests
	// use 127.0.0.1 unless they set another address, so abuse tests do not exhaust shared limits.
	use: { baseURL: 'http://localhost:4321', extraHTTPHeaders: { 'x-forwarded-for': '127.0.0.1' } },
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
