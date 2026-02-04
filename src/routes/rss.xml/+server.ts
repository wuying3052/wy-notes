import { getPosts } from '$lib/server/content';
import { SITE_CONFIG } from '$lib/config/site';

export const GET = async () => {
	const posts = await getPosts();
	const body = posts
		.map((post) => {
			return `
				<item>
					<title>${post.title}</title>
					<link>${SITE_CONFIG.url}/articles/${post.slug}</link>
					<description>${post.description || ''}</description>
					<pubDate>${new Date(post.date).toUTCString()}</pubDate>
				</item>
			`;
		})
		.join('');

	const xml = `
		<rss version="2.0">
			<channel>
				<title>${SITE_CONFIG.name}</title>
				<link>${SITE_CONFIG.url}</link>
				<description>${SITE_CONFIG.description}</description>
				${body}
			</channel>
		</rss>
	`.trim();

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml'
		}
	});
};
