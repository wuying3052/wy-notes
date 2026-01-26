import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getRoleInfo } from '$lib/server/rbac';

export const load: LayoutServerLoad = async (event) => {
	const pathname = event.url.pathname;

	if (pathname === '/admin/register') {
		return {};
	}

	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();
	if (!user) throw redirect(303, '/login');

	const roleInfo = await getRoleInfo(event.locals.supabase, user);

	const isSuperAdmin = roleInfo?.role === 'super_admin';
	const isAdmin = isSuperAdmin || roleInfo?.role === 'admin';
	const isCreator = isAdmin || roleInfo?.role === 'creator';

	// 权限检查
	const isCreatorOrHigher = isCreator || isAdmin || isSuperAdmin;

	const { data: profile, error: profileError } = await event.locals.supabase
		.from('profiles')
		.select('display_name, avatar_url')
		.eq('user_id', user.id)
		.maybeSingle();

	if (pathname !== '/admin/pending') {
		// 1. 如果根本不是 Creator (普通用户)，直接跳回前台首页，不让看 pending
		if (!isCreatorOrHigher) {
			throw redirect(302, '/');
		}
		// 2. 如果是 Creator 但状态不是 active (被封禁或待审核)，去 pending 页面
		if (roleInfo?.status !== 'active') {
			throw redirect(302, '/admin/pending');
		}
	} else {
		// 如果已经在 pending 页面，但状态已经是 active 且有权限，跳回 dashboard
		if (roleInfo?.status === 'active' && isCreatorOrHigher) {
			throw redirect(302, '/admin/dashboard');
		}
	}

	return {
		me: {
			id: user.id,
			email: user.email ?? '',
			displayName: profileError ? '' : (profile?.display_name ?? ''),
			avatarUrl: profileError ? '' : (profile?.avatar_url ?? '')
		},
		role: roleInfo?.role ?? 'user',
		status: roleInfo?.status ?? 'pending',
		isSuperAdmin,
		isAdmin,
		isCreator
	};
};
