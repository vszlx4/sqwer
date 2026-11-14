declare module 'seek-bzip' {
	/** Decompresses a whole bzip2 stream. */
	export function decode(input: Uint8Array): Buffer;
	const bzip: { decode: typeof decode };
	export default bzip;
}
