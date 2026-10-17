import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['packages/*/src/**/*.test.ts', 'apps/web/src/**/*.test.ts'],
		// Unit tests never read the app's .env file (which may point at the production database):
		// each test file uses a throwaway embedded database in a temporary folder (vitest.setup.ts).
		env: {
			SQWER_ENV_FILE: 'none',
			DATABASE_URL: '',
			PUBLIC_SITE_URL: 'https://sqwer.example'
		},
		setupFiles: ['./vitest.setup.ts']
	}
});
