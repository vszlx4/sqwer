/* Device, browser and OS labels from the user agent. The user agent itself is never stored. */

export interface Client {
	device: 'desktop' | 'mobile' | 'tablet';
	browser: string;
	os: string;
}

/** Crawlers, link previews, monitoring and HTTP libraries: their requests are not counted. */
const BOT =
	/bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|telegrambot|discordbot|monitor|pingdom|uptime|lighthouse|pagespeed|headlesschrome|phantomjs|puppeteer|playwright|selenium|curl|wget|python|httpx|aiohttp|go-http|java\/|okhttp|node-fetch|axios|undici|libwww|scrapy/i;

export const isBot = (ua: string | null) => !ua || BOT.test(ua);

export function parseClient(ua: string | null): Client {
	const s = ua ?? '';
	const tablet = /iPad|Tablet|PlayBook|Silk/i.test(s) || (/Android/i.test(s) && !/Mobile/i.test(s));
	const mobile = !tablet && /Mobi|iPhone|iPod|Android|IEMobile|Opera Mini/i.test(s);
	const browser = /Edg(e|A|iOS)?\//.test(s)
		? 'Edge'
		: /OPR\/|Opera/.test(s)
			? 'Opera'
			: /SamsungBrowser\//.test(s)
				? 'Samsung Internet'
				: /Firefox\/|FxiOS\//.test(s)
					? 'Firefox'
					: /Chrome\/|CriOS\//.test(s)
						? 'Chrome'
						: /Safari\//.test(s)
							? 'Safari'
							: 'Other';
	const os = /Windows/.test(s)
		? 'Windows'
		: /iPhone|iPad|iPod/.test(s)
			? 'iOS'
			: /Mac OS X|Macintosh/.test(s)
				? 'macOS'
				: /Android/.test(s)
					? 'Android'
					: /CrOS/.test(s)
						? 'ChromeOS'
						: /Linux/.test(s)
							? 'Linux'
							: 'Other';
	return { device: tablet ? 'tablet' : mobile ? 'mobile' : 'desktop', browser, os };
}
