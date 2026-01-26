import type { PageServerLoad } from './$types';
import { requireActiveRole } from '$lib/server/rbac';

const getCount = async (
	supabase: App.Locals['supabase'],
	table: string,
	options?: { published?: boolean; notDeleted?: boolean; createdBy?: string }
) => {
	let query = supabase.from(table).select('*', { count: 'exact', head: true });

	if (options?.published !== undefined) {
		query = query.eq('published', options.published);
	}

	if (options?.notDeleted) {
		query = query.is('deleted_at', null);
	}

	if (options?.createdBy) {
		query = query.eq('created_by', options.createdBy);
	}

	const { count, error } = await query;
	return error ? 0 : (count ?? 0);
};

export const load: PageServerLoad = async (event) => {
	const roleInfo = await requireActiveRole(event.locals.supabase, event.url.pathname);
	const { data: isAdmin } = await event.locals.supabase.rpc('is_admin');

	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();
	const userId = user?.id ?? '';
	// 根据角色和查询参数确定作用域
	const requestedScope = event.url.searchParams.get('scope');
	const isGlobalViewAllowed = isAdmin === true || roleInfo.role === 'admin';

	// 如果允许全局查看，则根据 scope 请求决定；否则默认全局
	// 如果不允许（创作者），强制查看“我的”内容
	const scopeUserId = isGlobalViewAllowed && requestedScope !== 'mine' ? undefined : userId;
	const currentScope = scopeUserId ? 'mine' : 'all';

	const [articlesTotal, articlesPublished, projectsTotal, resourcesTotal] = await Promise.all([
		getCount(event.locals.supabase, 'articles', { notDeleted: true, createdBy: scopeUserId }),
		getCount(event.locals.supabase, 'articles', {
			notDeleted: true,
			published: true,
			createdBy: scopeUserId
		}),
		getCount(event.locals.supabase, 'projects', { notDeleted: true, createdBy: scopeUserId }),
		isAdmin === true ? getCount(event.locals.supabase, 'resources', { notDeleted: true }) : 0
	]);

	let recentQuery = event.locals.supabase
		.from('articles')
		.select('id, title, created_at, published, deleted_at')
		.is('deleted_at', null)
		.order('created_at', { ascending: false });

	if (scopeUserId) recentQuery = recentQuery.eq('created_by', scopeUserId);

	const { data: articles } = await recentQuery.limit(5);

	const articleIds = (articles ?? []).map((article) => article.id);
	const commentCounts: Record<string, number> = {};

	if (articleIds.length > 0) {
		const { data: comments } = await event.locals.supabase
			.from('comments')
			.select('article_id')
			.in('article_id', articleIds);

		for (const comment of comments ?? []) {
			commentCounts[comment.article_id] = (commentCounts[comment.article_id] ?? 0) + 1;
		}
	}

	const recentArticles =
		articles?.map((article) => ({
			title: article.title,
			date: new Date(article.created_at).toLocaleDateString('zh-CN', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit'
			}),
			comments: commentCounts[article.id] ?? 0,
			status: article.published ? '已发布' : '草稿'
		})) ?? [];

	return {
		stats: {
			articlesTotal,
			articlesPublished,
			projectsTotal,
			resourcesTotal
		},
		recentArticles,
		currentScope,
		isGlobalViewAllowed
	};
};
