import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Each test file gets its own throwaway embedded database, so files can run in parallel.
process.env.SQWER_DATA_DIR = mkdtempSync(path.join(tmpdir(), 'sqwer-unit-'));
