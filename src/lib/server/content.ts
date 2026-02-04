import { dev } from '$app/environment';
import defaultCover from '$lib/assets/image/default-cover.png';

export interface Post {
    slug: string;
    title: string;
    date: string;
    created_at: string; // 统一日期字段
    description: string;
    tags: string[];
    published: boolean;
    cover_image?: string; // 统一封面图
    category?: string; // 新增分类
}

export interface Project {
    id: string;
    title: string;
    description: string;
    url?: string;
    github_url?: string;
    image?: string;
    tags: string[];
}

/**
 * 从 src/posts 加载所有 Markdown 帖子
 */
export async function getPosts(): Promise<Post[]> {
    const paths = import.meta.glob(['/src/posts/**/*.md'], { eager: true });
    // 自动加载封面图 (支持 png, jpg, webp)，位于 images 子目录
    const coverImages = import.meta.glob(['/src/posts/**/images/cover.{png,jpg,jpeg,webp}'], {
        eager: true,
        query: { url: true }
    });

    const posts: Post[] = [];

    for (const path in paths) {
        const file = paths[path];
        let slug = path.split('/').pop()?.replace('.md', '');

        // 处理页面包
        const parts = path.split('/');
        if (slug === 'index' || slug === parts[parts.length - 2]) {
            slug = parts[parts.length - 2];
        }

        if (file && typeof file === 'object' && 'metadata' in file && slug) {
            const metadata = file.metadata as any; // 临时类型断言读取字段

            const post: Post = {
                slug,
                title: metadata.title || 'Untitled',
                date: metadata.date || new Date().toISOString(),
                created_at: metadata.date || new Date().toISOString(),
                description: metadata.description || '',
                tags: metadata.tags || [],
                published: metadata.published ?? false,
                category: metadata.tags?.[0] || '未分类', // 将第一个标签用作分类
                cover_image: metadata.cover_image // Frontmatter 优先
            };

            // 自动发现封面图
            if (!post.cover_image) {
                const dir = path.substring(0, path.lastIndexOf('/'));

                // 在 coverImages 中查找以 dir/images/cover. 开头的文件
                for (const imgPath in coverImages) {
                    if (imgPath.startsWith(dir + '/images/cover.')) {
                        const imgModule = coverImages[imgPath] as { default: string };
                        post.cover_image = imgModule.default;
                        break;
                    }
                }
            }

            // 如果没有找到后备覆盖
            if (!post.cover_image) {
                post.cover_image = defaultCover;
            }

            if (post.published) {
                posts.push(post);
            }
        }
    }

    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return posts;
}
