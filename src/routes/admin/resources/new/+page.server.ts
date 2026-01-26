import type { PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/rbac';

export const load: PageServerLoad = async (event) => {
	await requireAdmin(event.locals.supabase, event.url.pathname);

	const { data: categories } = await event.locals.supabase
		.from('categories')
		.select('id,name,key')
		.eq('kind', 'resource')
		.order('name', { ascending: true });

	return { categories: categories ?? [] };
};
