import { supabase } from '$lib/supabase';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const { data: projectsRaw } = await supabase
		.from('projects')
		.select('title, slug, description, tags, cover_image, year, demo_url, repo_url, created_by')
		.eq('published', true)
		.is('deleted_at', null)
		.order('display_order', { ascending: true })
		.order('year', { ascending: false });

	// 获取作者信息
	let profilesMap: Record<string, any> = {};
	if (projectsRaw) {
		const userIds = [...new Set(projectsRaw.map((p) => p.created_by).filter(Boolean))];
		if (userIds.length > 0) {
			const { data: profiles } = await supabase
				.from('profiles')
				.select('user_id, display_name, avatar_url')
				.in('user_id', userIds);

			if (profiles) {
				profilesMap = Object.fromEntries(profiles.map((p) => [p.user_id, p]));
			}
		}
	}

	return {
		projects:
			projectsRaw?.map((p) => {
				const author = profilesMap[p.created_by];
				return {
					title: p.title,
					desc: p.description,
					tags: p.tags ?? [],
					image:
						p.cover_image ||
						'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60',
					url: `/projects/${p.slug}`,
					year: p.year?.toString() || new Date().getFullYear().toString(),
					demoUrl: p.demo_url,
					repoUrl: p.repo_url,
					author: {
						name: author?.display_name || 'Admin',
						avatar: author?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
					}
				};
			}) ?? []
	};
};
