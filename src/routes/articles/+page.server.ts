import { getPosts, type Post } from '$lib/server/content';

export const load = async () => {
	const posts = await getPosts();
	return {
		articles: posts.map((p: Post) => ({
			id: p.slug,
			title: p.title,
			slug: p.slug,
			excerpt: p.description || '',
			cover_image: p.cover_image || '/default-cover.png',
			created_at: p.date,
			category: p.category || '未分类',
			tags: p.tags || []
		}))
	};
};
