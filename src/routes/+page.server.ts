import { supabase } from '$lib/supabase';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [articlesResult, projectsResult] = await Promise.all([
		supabase
			.from('articles')
			.select('title, slug, excerpt, published_at, tags')
			.eq('published', true)
			.is('deleted_at', null)
			.order('published_at', { ascending: false })
			.limit(2),
		supabase
			.from('projects')
			.select('title, description, slug')
			.eq('published', true)
			.is('deleted_at', null)
			.order('display_order', { ascending: true })
			.limit(2)
	]);

	const articles = articlesResult.data;
	const projects = projectsResult.data;

	return {
		recentPosts:
			articles?.map((post) => ({
				title: post.title,
				desc: post.excerpt || '暂无摘要',
				date: new Date(post.published_at).toLocaleDateString('zh-CN'),
				slug: post.slug,
				tag: post.tags?.[0] || '文章'
			})) ?? [],
		projects:
			projects?.map((proj, index) => ({
				name: proj.title,
				desc: proj.description,
				color: index % 2 === 0 ? 'bg-sky-500' : 'bg-blue-500'
			})) ?? []
	};
};
