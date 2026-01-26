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

	// Query construction
	let query = event.locals.supabase
		.from('articles_with_category')
		.select('id,title,created_at,published,deleted_at,category,category_id,category_name,created_by')
		.order('created_at', { ascending: false });

	if ((isAdmin !== true && roleInfo.role !== 'admin') || isMineScope) {
		query = query.eq('created_by', userId);
	}

	const { data: articles } = await query;

	// Fetch profiles for authors
	let profilesMap = new Map<string, { display_name: string; avatar_url: string | null }>();
	if (articles && articles.length > 0) {
		const userIds = [...new Set(articles.map((a) => a.created_by).filter(Boolean))];
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

	const { data: categories } = await event.locals.supabase
		.from('categories')
		.select('id,name')
		.eq('kind', 'article')
		.order('name', { ascending: true });

	return {
		articles:
			articles?.map((a) => {
				const profile = a.created_by ? profilesMap.get(a.created_by) : null;
				return {
					id: a.id,
					title: a.title,
					author: profile?.display_name || '未知用户',
					author_avatar: profile?.avatar_url || null,
					status: a.deleted_at ? '已删除' : a.published ? '已发布' : '草稿',
					date: new Date(a.created_at).toLocaleDateString('zh-CN', {
						year: 'numeric',
						month: '2-digit',
						day: '2-digit'
					}),
					category: a.category_name || a.category || '未分类',
					category_id: a.category_id ?? null
				};
			}) ?? [],
		categories: categories ?? [],
		isGlobalViewAllowed: roleInfo.role === 'admin' || roleInfo.role === 'super_admin',
		currentScope: isMineScope ? 'mine' : 'all'
	};
};
