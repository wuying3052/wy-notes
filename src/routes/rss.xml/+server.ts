import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
    const { supabase } = locals;

    // 获取最新的 20 篇文章
    const { data: articles } = await supabase
        .from('articles')
        .select('title, slug, excerpt, published_at')
        .eq('published', true)
        .is('deleted_at', null)
        .order('published_at', { ascending: false })
        .limit(20);

    const siteUrl = 'https://wy-notes.pages.dev';
    const siteTitle = 'WY NOTES';
    const siteDescription = '让知识更可检索，让实践更可复用';

    const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
	<title>${siteTitle}</title>
	<link>${siteUrl}</link>
	<description>${siteDescription}</description>
	<atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
	${(articles ?? [])
            .map(
                (a) => `
	<item>
		<title><![CDATA[${a.title}]]></title>
		<link>${siteUrl}/articles/${a.slug}</link>
		<guid>${siteUrl}/articles/${a.slug}</guid>
		<pubDate>${new Date(a.published_at).toUTCString()}</pubDate>
		<description><![CDATA[${a.excerpt || ''}]]></description>
	</item>`
            )
            .join('')}
</channel>
</rss>`;

    return new Response(rss, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'max-age=0, s-maxage=3600'
        }
    });
};
