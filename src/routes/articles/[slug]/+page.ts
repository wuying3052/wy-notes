import { error } from '@sveltejs/kit';
import defaultCover from '$lib/assets/image/default-cover.png';

export const load = async ({ params }) => {
    try {
        let post;
        try {
            post = await import(`@posts/${params.slug}.md`);
        } catch {
            try {
                post = await import(`@posts/${params.slug}/index.md`);
            } catch {
                post = await import(`@posts/${params.slug}/${params.slug}.md`);
            }
        }

        // 自动发现封面图 logic (client-side compatible via Vite glob)
        const coverImages = import.meta.glob('/src/posts/**/images/cover.{svg,png,jpg,jpeg,webp}', {
            eager: true,
            query: { url: true }
        });

        let coverImage = post.metadata.cover || post.metadata.cover_image;

        // 如果没有在 frontmatter 中指定，尝试自动发现
        if (!coverImage) {
            const extPriority = ['svg', 'webp', 'png', 'jpg', 'jpeg'];
            const candidates: Record<string, string> = {};
            for (const path in coverImages) {
                // 匹配路径：.../slug/images/cover.ext
                if (path.includes(`/${params.slug}/images/cover.`)) {
                    const ext = path.split('.').pop()?.toLowerCase();
                    const imgModule = coverImages[path] as { default: string };
                    if (ext) candidates[ext] = imgModule.default;
                }
            }

            for (const ext of extPriority) {
                if (candidates[ext]) {
                    coverImage = candidates[ext];
                    break;
                }
            }
        }

        // Fallback
        if (!coverImage) {
            coverImage = defaultCover;
        }

        return {
            content: post.default,
            meta: {
                ...post.metadata,
                cover: coverImage // 规范化为模板的“覆盖”

            }
        };
    } catch (e) {
        error(404, `Could not find ${params.slug}`);
    }
};
