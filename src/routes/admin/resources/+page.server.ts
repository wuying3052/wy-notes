import type { PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/rbac';

export const load: PageServerLoad = async (event) => {
	await requireAdmin(event.locals.supabase, event.url.pathname);

	const { data: resources, error } = await event.locals.supabase
		.from('resources_with_category')
		.select('id,title,description,url,category_id,category,category_name')
		.is('deleted_at', null)
		.order('created_at', { ascending: false });

	if (error) {
		return { resources: [] };
	}

	return {
		resources: resources || []
	};
};
