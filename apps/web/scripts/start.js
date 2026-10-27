// Cross-platform production start (inline env vars don't work on Windows).
process.env.BODY_SIZE_LIMIT ??= '6M';
await import('../build/index.js');
