import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { requireActiveRole } from '$lib/server/rbac';

export const load: PageServerLoad = async (event) => {
	await requireActiveRole(event.locals.supabase, event.url.pathname);

	const id = event.params.id;
	const { data, error: dbError } = await event.locals.supabase
		.from('projects')
		.select('*')
		.eq('id', id)
		.maybeSingle();

	if (dbError) throw error(500, '加载项目失败');
	if (!data) throw error(404, '项目不存在');

	return {
		project: data
	};
};
