import { SITE_CONFIG } from '$lib/config/site';

export const GET = () => {
    const body = `User-agent: *
Allow: /

Sitemap: ${SITE_CONFIG.url}/sitemap.xml
`.trim();

    return new Response(body, {
        headers: {
            'Content-Type': 'text/plain'
        }
    });
};
