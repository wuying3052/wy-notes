import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { requireActiveRole } from '$lib/server/rbac';

export const load: PageServerLoad = async (event) => {
	await requireActiveRole(event.locals.supabase, event.url.pathname);

	const id = event.params.id;
	const { data, error: dbError } = await event.locals.supabase
		.from('articles_with_category')
		.select('*')
		.eq('id', id)
		.maybeSingle();

	if (dbError) throw error(500, '加载文章失败');
	if (!data) throw error(404, '文章不存在');

	const { data: categories } = await event.locals.supabase
		.from('categories')
		.select('id,name')
		.eq('kind', 'article')
		.order('name', { ascending: true });

	return {
		article: data,
		categories: categories ?? []
	};
};
