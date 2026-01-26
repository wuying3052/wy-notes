import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { requireActiveRole } from '$lib/server/rbac';
import { publicUrlToTrackedPath } from '$lib/utils/fileTracking';

export const load: PageServerLoad = async (event) => {
	// 验证权限
	await requireActiveRole(event.locals.supabase, event.url.pathname);

	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();

	if (!user) return { profile: null, role: null, roleStatus: null, lastSignInAt: null, email: null };

	// 获取 profile 数据（包含 role 和 status）
	const { data: profile } = await event.locals.supabase
		.from('profiles')
		.select('user_id, display_name, avatar_url, created_at, role, status')
		.eq('user_id', user.id)
		.maybeSingle();

	if (!profile) {
		return {
			profile: {
				user_id: user.id,
				display_name: user.user_metadata?.name || '',
				avatar_url: user.user_metadata?.avatar_url || '',
				created_at: user.created_at,
				role: 'editor',
				status: 'pending'
			},
			role: 'editor',
			roleStatus: 'pending',
			lastSignInAt: user.last_sign_in_at,
			email: user.email
		};
	}

	return {
		profile,
		role: profile.role ?? 'editor',
		roleStatus: profile.status ?? 'pending',
		lastSignInAt: user.last_sign_in_at,
		email: user.email
	};
};

export const actions: Actions = {
	update_profile: async (event) => {
		await requireActiveRole(event.locals.supabase, event.url.pathname);
		const form = await event.request.formData();
		const displayName = String(form.get('display_name') ?? '').trim();
		const avatarUrl = String(form.get('avatar_url') ?? '').trim();

		const {
			data: { user }
		} = await event.locals.supabase.auth.getUser();

		if (!user) return fail(401, { message: '未登录' });

		// 如果昵称为空，尝试使用邮箱前缀作为默认昵称
		const nameToSave = displayName || user.email?.split('@')[0] || 'User';

		// 使用 upsert 替代 update，确保记录不存在时自动创建
		const { error } = await event.locals.supabase.from('profiles').upsert(
			{
				user_id: user.id,
				display_name: nameToSave,
				avatar_url: avatarUrl || null, // 允许清除头像
				updated_at: new Date().toISOString()
			},
			{ onConflict: 'user_id' }
		);

		if (error) {
			console.error('Profile update error:', error);
			return fail(500, { message: `保存失败: ${error.message} (${error.code})` });
		}

		// 文件引用追踪已改为基于内容扫描，不再需要手动绑定

		return { ok: true };
	},

	change_password: async (event) => {
		await requireActiveRole(event.locals.supabase, event.url.pathname);
		const form = await event.request.formData();
		const newPassword = String(form.get('new_password') ?? '');

		if (newPassword.length < 8) {
			return fail(400, { field: 'new_password', message: '密码至少需要 8 位' });
		}

		const { error } = await event.locals.supabase.auth.updateUser({ password: newPassword });

		if (error) {
			console.error('Password change error:', error);
			return fail(500, { message: '修改失败: ' + error.message });
		}

		return { ok: true };
	}
};
