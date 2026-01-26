import { redirect, error as kitError } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';

// 角色层级：user < creator < admin < super_admin
export type UserRole = 'user' | 'creator' | 'admin' | 'super_admin';
export type RoleStatus = 'pending' | 'active' | 'suspended';

export type RoleInfo = {
	role: UserRole;
	status: RoleStatus;
};

// 角色层级，数字越大权限越高
const ROLE_LEVEL: Record<UserRole, number> = {
	user: 0,
	creator: 1,
	admin: 2,
	super_admin: 3
};

export function canManageRole(actor: UserRole, target: UserRole): boolean {
	// 只有超级管理员可以管理角色
	return actor === 'super_admin' && target !== 'super_admin';
}

export function canAccessAdmin(role: UserRole): boolean {
	// creator 及以上可以访问后台
	return ROLE_LEVEL[role] >= ROLE_LEVEL['creator'];
}

export async function getRoleInfo(
	supabase: SupabaseClient,
	user?: { id: string } | null
): Promise<RoleInfo | null> {
	if (!user) {
		const {
			data: { user: fetchedUser }
		} = await supabase.auth.getUser();
		user = fetchedUser;
	}
	if (!user) return null;

	const { data, error } = await supabase
		.from('profiles')
		.select('role, status')
		.eq('user_id', user.id)
		.maybeSingle();

	if (error) return null;
	if (!data) return null;

	return {
		role: (data.role as UserRole) ?? 'user',
		status: (data.status as RoleStatus) ?? 'pending'
	};
}

export async function requireSignedIn(supabase: SupabaseClient, returnTo: string) {
	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (!user) throw redirect(303, `/login?returnTo=${encodeURIComponent(returnTo)}`);
	return user;
}

export async function requireActiveRole(
	supabase: SupabaseClient,
	returnTo: string,
	user?: { id: string } | null
) {
	if (!user) {
		user = await requireSignedIn(supabase, returnTo);
	}
	const roleInfo = await getRoleInfo(supabase, user);
	if (!roleInfo) throw redirect(303, '/admin/pending');
	if (roleInfo.status !== 'active') throw redirect(303, '/admin/pending');
	// 检查是否有后台访问权限 (creator 及以上)
	if (!canAccessAdmin(roleInfo.role)) throw redirect(303, '/admin/pending');
	return roleInfo;
}

export async function requireAdmin(
	supabase: SupabaseClient,
	returnTo: string,
	user?: { id: string } | null
) {
	const roleInfo = await requireActiveRole(supabase, returnTo, user);
	// admin 或 super_admin 才有管理权限
	if (roleInfo.role !== 'admin' && roleInfo.role !== 'super_admin') {
		throw kitError(403, '权限不足');
	}
	return roleInfo;
}

export async function requireSuperAdmin(
	supabase: SupabaseClient,
	returnTo: string,
	user?: { id: string } | null
) {
	const roleInfo = await requireActiveRole(supabase, returnTo, user);
	if (roleInfo.role !== 'super_admin') {
		throw kitError(403, '仅超级管理员可执行此操作');
	}
	return roleInfo;
}
