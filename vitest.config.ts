import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['packages/*/src/**/*.test.ts', 'apps/web/src/**/*.test.ts', 'scripts/**/*.test.ts'],
		// Tests never read .env; each file gets a temporary embedded database (vitest.setup.ts).
		env: {
			SQWER_ENV_FILE: 'none',
			DATABASE_URL: '',
			PUBLIC_SITE_URL: 'https://sqwer.example'
		},
		setupFiles: ['./vitest.setup.ts'],
		// The first database use in a file runs every migration, which is slow on a busy machine.
		testTimeout: 30_000
	}
});
