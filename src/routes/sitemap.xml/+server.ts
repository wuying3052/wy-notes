import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
    const { supabase } = locals;

    // 获取所有文章和项目
    const [articlesResult, projectsResult] = await Promise.all([
        supabase
            .from('articles')
            .select('slug, updated_at')
            .eq('published', true)
            .is('deleted_at', null)
            .order('updated_at', { ascending: false }),
        supabase
            .from('projects')
            .select('slug, updated_at')
            .eq('published', true)
            .is('deleted_at', null)
            .order('updated_at', { ascending: false })
    ]);

    const articles = articlesResult.data ?? [];
    const projects = projectsResult.data ?? [];

    // 获取站点域名 (建议在 .env 中设置 PUBLIC_SITE_URL)
    // 这里预设一个占位，实际部署时应通过环境变量获取
    const siteUrl = 'https://wy-notes.pages.dev';

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url>
		<loc>${siteUrl}/</loc>
		<changefreq>daily</changefreq>
		<priority>1.0</priority>
	</url>
	<url>
		<loc>${siteUrl}/articles</loc>
		<changefreq>daily</changefreq>
		<priority>0.8</priority>
	</url>
	<url>
		<loc>${siteUrl}/projects</loc>
		<changefreq>daily</changefreq>
		<priority>0.8</priority>
	</url>
	${articles
            .map(
                (a) => `
	<url>
		<loc>${siteUrl}/articles/${a.slug}</loc>
		<lastmod>${new Date(a.updated_at).toISOString()}</lastmod>
		<changefreq>weekly</changefreq>
		<priority>0.7</priority>
	</url>`
            )
            .join('')}
	${projects
            .map(
                (p) => `
	<url>
		<loc>${siteUrl}/projects/${p.slug}</loc>
		<lastmod>${new Date(p.updated_at).toISOString()}</lastmod>
		<changefreq>monthly</changefreq>
		<priority>0.6</priority>
	</url>`
            )
            .join('')}
</urlset>`;

    return new Response(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'max-age=0, s-maxage=3600'
        }
    });
};
