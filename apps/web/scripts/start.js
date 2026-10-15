// Starts the production server on any operating system (environment variables set inline,
// as in `BODY_SIZE_LIMIT=6M node build`, do not work in the Windows command line).
process.env.BODY_SIZE_LIMIT ??= '6M';
await import('../build/index.js');
