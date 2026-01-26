import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/rbac';

export const load: PageServerLoad = async (event) => {
	await requireAdmin(event.locals.supabase, event.url.pathname);

	const id = event.params.id;
	const { data, error: dbError } = await event.locals.supabase
		.from('resources_with_category')
		.select('*')
		.eq('id', id)
		.maybeSingle();

	if (dbError) throw error(500, '加载资源失败');
	if (!data) throw error(404, '资源不存在');

	const { data: categories } = await event.locals.supabase
		.from('categories')
		.select('id,name,key')
		.eq('kind', 'resource')
		.order('name', { ascending: true });

	return { resource: data, categories: categories ?? [] };
};
