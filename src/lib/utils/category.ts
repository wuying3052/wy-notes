export function normalizeCategoryKey(input: string): string {
	const trimmed = (input ?? '').trim().toLowerCase();
	const collapsed = trimmed.replace(/[\s\-_]+/g, '').replace(/\//g, '');
	return collapsed.replace(/[^a-z0-9\u4e00-\u9fff]+/g, '');
}
