import type { PageServerLoad } from './$types';
import { requireActiveRole } from '$lib/server/rbac';

export const load: PageServerLoad = async (event) => {
	await requireActiveRole(event.locals.supabase, event.url.pathname);

	const { data: categories } = await event.locals.supabase
		.from('categories')
		.select('id,name')
		.eq('kind', 'article')
		.order('name', { ascending: true });

	return { categories: categories ?? [] };
};
