import type { PageServerLoad } from './$types';
import { requireActiveRole } from '$lib/server/rbac';

export const load: PageServerLoad = async (event) => {
	const roleInfo = await requireActiveRole(event.locals.supabase, event.url.pathname);

	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();
	const userId = user?.id ?? '';

	const { data: isAdmin } = await event.locals.supabase.rpc('is_admin');

	const scope = event.url.searchParams.get('scope');
	const isMineScope = scope === 'mine';

	// Fetch projects
	let query = event.locals.supabase
		.from('projects')
		.select('*')
		.order('display_order', { ascending: true })
		.order('created_at', { ascending: false });

	if ((isAdmin !== true && roleInfo.role !== 'admin') || isMineScope) {
		query = query.eq('created_by', userId).is('deleted_at', null);
	}

	const { data: projects, error } = await query;

	if (error) {
		console.error('Projects fetch error:', error);
		return { projects: [] };
	}

	// Fetch profiles for authors
	let profilesMap = new Map<string, { display_name: string; avatar_url: string | null }>();
	if (projects && projects.length > 0) {
		const userIds = [...new Set(projects.map((p) => p.created_by).filter(Boolean))];
		const { data: profiles } = await event.locals.supabase
			.from('profiles')
			.select('user_id, display_name, avatar_url')
			.in('user_id', userIds);

		if (profiles) {
			profiles.forEach((p) => {
				profilesMap.set(p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url });
			});
		}
	}

	return {
		projects:
			projects?.map((p) => {
				const author = p.created_by ? profilesMap.get(p.created_by) : null;
				return {
					...p,
					status: p.deleted_at ? '已删除' : (p.published ? '已发布' : '草稿'),
					author_name: author?.display_name || 'Unknown',
					author_avatar: author?.avatar_url || ''
				};
			}) ?? [],
		isGlobalViewAllowed: roleInfo.role === 'admin' || roleInfo.role === 'super_admin',
		currentScope: isMineScope ? 'mine' : 'all'
	};
};
