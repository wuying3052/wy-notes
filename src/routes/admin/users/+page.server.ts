import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { requireAdmin, getRoleInfo } from '$lib/server/rbac';

export const load: PageServerLoad = async (event) => {
	// 管理员和超级管理员都可以管理用户
	const roleInfo = await requireAdmin(event.locals.supabase, event.url.pathname);

	// 从合并后的 profiles 表获取用户列表
	const { data: profiles, error } = await event.locals.supabase
		.from('profiles')
		.select('user_id, display_name, avatar_url, role, status, created_at, updated_at')
		.order('created_at', { ascending: false });

	if (error) {
		return { users: [], currentUserId: null };
	}

	// 获取当前用户 ID
	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();

	return {
		users:
			(profiles ?? []).map((p) => ({
				user_id: p.user_id,
				display_name: p.display_name ?? '',
				avatar_url: p.avatar_url ?? '',
				role: p.role ?? 'user',
				status: p.status ?? 'pending',
				created_at: p.created_at
			})) ?? [],
		currentUserRole: roleInfo.role,
		currentUserId: user?.id ?? null
	};
};

async function getActorId(supabase: App.Locals['supabase']) {
	const {
		data: { user }
	} = await supabase.auth.getUser();
	return user?.id ?? null;
}

async function getTargetRole(supabase: App.Locals['supabase'], userId: string) {
	const { data } = await supabase
		.from('profiles')
		.select('role')
		.eq('user_id', userId)
		.maybeSingle();
	return data?.role ?? 'user';
}

export const actions: Actions = {
	approve: async (event) => {
		await requireAdmin(event.locals.supabase, event.url.pathname);
		const form = await event.request.formData();
		const userId = String(form.get('user_id') ?? '');
		if (!userId) return fail(400);

		const { error } = await event.locals.supabase
			.from('profiles')
			.update({
				status: 'active',
				updated_at: new Date().toISOString()
			})
			.eq('user_id', userId);

		if (error) return fail(500);
		return { ok: true };
	},
	suspend: async (event) => {
		const roleInfo = await requireAdmin(event.locals.supabase, event.url.pathname);
		const form = await event.request.formData();
		const userId = String(form.get('user_id') ?? '');
		if (!userId) return fail(400);

		const actorId = await getActorId(event.locals.supabase);
		if (actorId && actorId === userId) return fail(400, { message: '不能冻结当前登录账号' });

		// 不能冻结超级管理员
		const targetRole = await getTargetRole(event.locals.supabase, userId);
		if (targetRole === 'super_admin') return fail(400, { message: '不能冻结超级管理员' });

		// 普通管理员不能冻结其他管理员
		if (roleInfo.role === 'admin' && targetRole === 'admin') {
			return fail(403, { message: '管理员不能冻结其他管理员' });
		}

		const { error } = await event.locals.supabase
			.from('profiles')
			.update({ status: 'suspended', updated_at: new Date().toISOString() })
			.eq('user_id', userId);

		if (error) return fail(500);
		return { ok: true };
	},
	promote_admin: async (event) => {
		// 只有超级管理员可以任命管理员
		const roleInfo = await requireAdmin(event.locals.supabase, event.url.pathname);
		if (roleInfo.role !== 'super_admin') {
			return fail(403, { message: '只有超级管理员可以任命管理员' });
		}

		const form = await event.request.formData();
		const userId = String(form.get('user_id') ?? '');
		if (!userId) return fail(400);

		// 不能修改超级管理员
		const targetRole = await getTargetRole(event.locals.supabase, userId);
		if (targetRole === 'super_admin') return fail(400, { message: '不能修改超级管理员角色' });

		const { error } = await event.locals.supabase
			.from('profiles')
			.update({ role: 'admin', status: 'active', updated_at: new Date().toISOString() })
			.eq('user_id', userId);

		if (error) return fail(500);
		return { ok: true };
	},
	demote_creator: async (event) => {
		// 只有超级管理员可以降级管理员
		const roleInfo = await requireAdmin(event.locals.supabase, event.url.pathname);
		if (roleInfo.role !== 'super_admin') {
			return fail(403, { message: '只有超级管理员可以降级管理员' });
		}

		const form = await event.request.formData();
		const userId = String(form.get('user_id') ?? '');
		if (!userId) return fail(400);

		const actorId = await getActorId(event.locals.supabase);
		if (actorId && actorId === userId) return fail(400, { message: '不能降级当前登录账号' });

		// 不能降级超级管理员
		const targetRole = await getTargetRole(event.locals.supabase, userId);
		if (targetRole === 'super_admin') return fail(400, { message: '不能降级超级管理员' });

		const { error } = await event.locals.supabase
			.from('profiles')
			.update({ role: 'creator', updated_at: new Date().toISOString() })
			.eq('user_id', userId);

		if (error) return fail(500);
		return { ok: true };
	}
};
