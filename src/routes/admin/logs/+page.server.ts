import type { PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/rbac';

type OperationLogRow = {
	id: string;
	user_id: string | null;
	action: string;
	entity_type: string;
	entity_id: string | null;
	details: unknown;
	ip_address: string | null;
	user_agent: string | null;
	created_at: string;
};

type LogUser = { email: string | null; display_name: string | null } | null;

export const load: PageServerLoad = async ({ locals, url }) => {
	await requireAdmin(locals.supabase, url.pathname);
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 50;
	const offset = (page - 1) * limit;

	// 获取筛选参数
	const actionFilter = url.searchParams.get('action') || '';
	const entityTypeFilter = url.searchParams.get('entity_type') || '';
	const q = (url.searchParams.get('q') || '').trim();
	const userFilter = (url.searchParams.get('user') || '').trim();

	let filteredUserIds: string[] | null = null;
	if (userFilter) {
		const { data: profiles, error } = await locals.supabase
			.from('profiles')
			.select('user_id')
			.ilike('email', `%${userFilter}%`);

		if (error) {
			return { logs: [], total: 0, page, limit };
		}

		filteredUserIds = (profiles || [])
			.map((p) => p.user_id)
			.filter((id): id is string => typeof id === 'string');

		if (filteredUserIds.length === 0) {
			return { logs: [], total: 0, page, limit };
		}
	}

	// 构建查询
	let query = locals.supabase
		.from('logs')
		.select(
			'id, user_id, action, entity_type, entity_id, details, ip_address, user_agent, created_at',
			{
				count: 'exact'
			}
		)
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	// 应用筛选
	if (actionFilter) {
		query = query.eq('action', actionFilter);
	}
	if (entityTypeFilter) {
		query = query.eq('entity_type', entityTypeFilter);
	}
	if (filteredUserIds) {
		query = query.in('user_id', filteredUserIds);
	}
	if (q) {
		if (/^[0-9a-fA-F-]{36}$/.test(q)) {
			query = query.eq('entity_id', q);
		} else {
			query = query.or(`action.ilike.%${q}%,entity_type.ilike.%${q}%`);
		}
	}

	const { data: rawLogs, error, count } = await query;

	if (error) {
		return { logs: [], total: 0, page, limit };
	}

	const logs = (rawLogs || []) as OperationLogRow[];
	const userIds = Array.from(
		new Set(logs.map((l) => l.user_id).filter((id): id is string => typeof id === 'string'))
	);

	let profileMap = new Map<string, Exclude<LogUser, null>>();
	if (userIds.length) {
		const { data: profiles } = await locals.supabase
			.from('profiles')
			.select('user_id, email, display_name')
			.in('user_id', userIds);

		profileMap = new Map(
			(profiles || []).map((p) => [
				p.user_id,
				{ email: p.email ?? null, display_name: p.display_name ?? null }
			])
		);
	}

	return {
		logs: logs.map((l) => ({
			...l,
			user: typeof l.user_id === 'string' ? (profileMap.get(l.user_id) ?? null) : null
		})),
		total: count || 0,
		page,
		limit
	};
};
