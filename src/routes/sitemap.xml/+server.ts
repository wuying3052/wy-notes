import { getPosts } from '$lib/server/content';

export const GET = async () => {
    const posts = await getPosts();
    const pages = [
        'https://wy-notes.vercel.app',
        'https://wy-notes.vercel.app/articles',
        'https://wy-notes.vercel.app/projects',
        'https://wy-notes.vercel.app/resources',
        'https://wy-notes.vercel.app/about'
    ];

    const postLinks = posts.map(
        (post) => `
		<url>
			<loc>https://wy-notes.vercel.app/articles/${post.slug}</loc>
			<lastmod>${new Date(post.date).toISOString()}</lastmod>
		</url>
	`
    );

    const body = `
		<?xml version="1.0" encoding="UTF-8" ?>
		<urlset
			xmlns="https://www.sitemaps.org/schemas/sitemap/0.9"
			xmlns:xhtml="https://www.w3.org/1999/xhtml"
			xmlns:mobile="https://www.google.com/schemas/sitemap-mobile/1.0"
			xmlns:news="https://www.google.com/schemas/sitemap-news/0.9"
			xmlns:image="https://www.google.com/schemas/sitemap-image/1.1"
			xmlns:video="https://www.google.com/schemas/sitemap-video/1.1"
		>
			${pages
            .map(
                (url) => `
				<url>
					<loc>${url}</loc>
				</url>
			`
            )
            .join('')}
			${postLinks.join('')}
		</urlset>
	`.trim();

    return new Response(body, {
        headers: {
            'Content-Type': 'application/xml'
        }
    });
};
