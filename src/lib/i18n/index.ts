import { writable } from 'svelte/store';

export type Locale = 'zh-CN';

export const locale = writable<Locale>('zh-CN');

type MessageDict = Record<string, string>;

const messages: Record<Locale, MessageDict> = {
	'zh-CN': {
		'toast.ok': '操作成功',
		'toast.saved': '保存成功',
		'toast.updated': '更新成功',
		'toast.deleted': '删除成功',
		'toast.uploaded': '上传成功',
		'toast.login_success': '登录成功',
		'toast.network_error': '网络连接问题，请稍后重试',
		'toast.unknown_error': '操作失败，请稍后重试',
		'toast.validation_failed': '表单校验失败',
		'toast.auth_invalid_credentials': '账号或密码错误',
		'toast.auth_locked': '账户已锁定，请稍后再试',
		'toast.auth_rate_limited': '请求过于频繁，请稍后再试',
		'toast.permission_denied': '权限不足，无法执行此操作',
		'toast.not_found': '未找到相关内容',
		'toast.server_error': '服务暂时不可用，请稍后重试',
		'confirm.title': '请确认操作',
		'confirm.cancel': '取消',
		'confirm.confirm': '确定'
	}
};

export function t(key: string, vars?: Record<string, string | number>): string {
	const template = messages['zh-CN'][key] ?? key;

	if (!vars) return template;
	return template.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}
