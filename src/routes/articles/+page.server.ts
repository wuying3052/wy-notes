import { supabase } from '$lib/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const { data: articles, error } = await supabase
		.from('articles_with_category')
		.select(
			'id, title, slug, excerpt, cover_image, created_at, category, category_id, category_name'
		)
		.eq('published', true)
		.is('deleted_at', null)
		.order('created_at', { ascending: false });

	if (error) {
		return { articles: [] };
	}

	const mapped =
		articles?.map((article) => ({
			id: article.id,
			title: article.title,
			slug: article.slug,
			excerpt: article.excerpt || '暂无摘要',
			cover_image:
				article.cover_image ||
				'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
			created_at: article.created_at,
			category: article.category_name || article.category || '未分类'
		})) ?? [];

	return {
		articles: mapped
	};
};
