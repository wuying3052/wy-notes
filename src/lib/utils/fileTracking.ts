import { PUBLIC_SUPABASE_URL } from '$env/static/public';

export function publicUrlToTrackedPath(publicUrl: string): string | null {
	try {
		const url = new URL(publicUrl);
		const base = new URL(PUBLIC_SUPABASE_URL);
		if (url.origin !== base.origin) return null;

		const marker = '/storage/v1/object/public/';
		const idx = url.pathname.indexOf(marker);
		if (idx === -1) return null;

		const rest = url.pathname.slice(idx + marker.length);
		const [bucket, ...pathParts] = rest.split('/');
		if (!bucket || pathParts.length === 0) return null;

		return `${bucket}/${pathParts.join('/')}`;
	} catch {
		return null;
	}
}

export function extractTrackedPathsFromContent(text: string): string[] {
	const result = new Set<string>();
	if (!text) return [];

	const markdownImage = /!\[[^\]]*?\]\(([^)]+)\)/g;
	const htmlImage = /<img[^>]*\s+src=["']([^"']+)["'][^>]*>/gi;
	const urlLike = /https?:\/\/[^\s)"]+/g;

	const collect = (raw: string) => {
		const cleaned = raw.trim().replace(/^<|>$/g, '');
		const tracked = publicUrlToTrackedPath(cleaned);
		if (tracked) result.add(tracked);
	};

	for (const match of text.matchAll(markdownImage)) collect(match[1] ?? '');
	for (const match of text.matchAll(htmlImage)) collect(match[1] ?? '');
	for (const match of text.matchAll(urlLike)) collect(match[0] ?? '');

	return [...result];
}
