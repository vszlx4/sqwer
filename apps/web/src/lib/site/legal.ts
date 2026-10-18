/**
 * Register of sqwer's legal and policy documents. Each document has a permanent reference, a
 * version and an effective date, so that what a person accepted can always be identified.
 * Change the version and date of a document whenever its substance changes.
 */
export interface LegalDocument {
	ref: string;
	title: string;
	href: string;
	version: string;
	effective: string;
	/** Effective date in ISO 8601 format, for machine-readable use. */
	effectiveIso: string;
	summary: string;
}

export const LEGAL_DOCUMENTS = {
	terms: {
		ref: 'SQW-LGL-001',
		title: 'Terms and Conditions',
		href: '/terms',
		version: '2.2',
		effective: '16 October 2026',
		effectiveIso: '2026-10-16',
		summary: 'The agreement between you and sqwer: accounts, acceptable use, intellectual property, liability and disputes.'
	},
	privacy: {
		ref: 'SQW-LGL-002',
		title: 'Privacy Policy',
		href: '/privacy',
		version: '2.4',
		effective: '18 October 2026',
		effectiveIso: '2026-10-18',
		summary: 'What personal data sqwer processes, why, on what legal basis, for how long, with whom, and your rights.'
	},
	cookies: {
		ref: 'SQW-LGL-003',
		title: 'Cookie and Storage Policy',
		href: '/cookies',
		version: '2.4',
		effective: '18 October 2026',
		effectiveIso: '2026-10-18',
		summary: 'The single strictly necessary cookie, the analytics identifiers kept only with your consent, and every item sqwer keeps in your browser.'
	},
	copyright: {
		ref: 'SQW-LGL-004',
		title: 'Content and Copyright Policy',
		href: '/copyright',
		version: '1.1',
		effective: '15 October 2026',
		effectiveIso: '2026-10-15',
		summary: 'Rules for profile pictures and other content you provide, and how to report infringement.'
	},
	accessibility: {
		ref: 'SQW-LGL-005',
		title: 'Accessibility Statement',
		href: '/accessibility',
		version: '1.0',
		effective: '15 October 2026',
		effectiveIso: '2026-10-15',
		summary: 'The accessibility standard sqwer aims to meet, known limitations and how to request help.'
	},
	security: {
		ref: 'SQW-LGL-006',
		title: 'Security and Vulnerability Disclosure Policy',
		href: '/security',
		version: '1.0',
		effective: '15 October 2026',
		effectiveIso: '2026-10-15',
		summary: 'How sqwer protects the service and your data, and how to report a vulnerability.'
	}
} as const satisfies Record<string, LegalDocument>;

export type LegalKey = keyof typeof LEGAL_DOCUMENTS;

/**
 * Recorded with each new account as evidence of what was accepted: the Terms and Conditions
 * and Privacy Policy versions in force at registration.
 */
export const ACCEPTANCE_VERSION = `terms-${LEGAL_DOCUMENTS.terms.version}+privacy-${LEGAL_DOCUMENTS.privacy.version}`;

/** Most recent effective date across all documents, shown in the legal centre. */
export const LEGAL_UPDATED = '16 October 2026';
