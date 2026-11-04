import type { Action } from 'svelte/action';

/**
 * Labels every body cell with its column header (data-label) and pins table roles, so a table restyled into
 * stacked rows on narrow screens keeps its header for each value and its table semantics. Nothing scrolls sideways.
 * Rows added later are labelled as they arrive.
 */
export const stackTable: Action<HTMLTableElement> = (table) => {
	const label = () => {
		const heads = [...table.querySelectorAll('thead th')].map((th) => th.textContent?.trim() ?? '');
		table.setAttribute('role', 'table');
		for (const group of table.querySelectorAll('thead, tbody')) group.setAttribute('role', 'rowgroup');
		for (const th of table.querySelectorAll('thead th')) th.setAttribute('role', 'columnheader');
		for (const row of table.querySelectorAll('tr')) {
			row.setAttribute('role', 'row');
			if (row.parentElement?.tagName !== 'TBODY') continue;
			[...row.children].forEach((cell, i) => {
				cell.setAttribute('role', cell.tagName === 'TH' ? 'rowheader' : 'cell');
				if (heads[i]) cell.setAttribute('data-label', heads[i]);
			});
		}
	};
	label();
	const observer = new MutationObserver(label);
	observer.observe(table, { childList: true, subtree: true });
	return { destroy: () => observer.disconnect() };
};
