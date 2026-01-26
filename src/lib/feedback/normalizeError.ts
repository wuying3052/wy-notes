export type ErrorKind =
	| 'network'
	| 'validation'
	| 'auth_invalid_credentials'
	| 'auth_locked'
	| 'auth_rate_limited'
	| 'permission'
	| 'not_found'
	| 'server'
	| 'unknown';

export type NormalizedError = {
	kind: ErrorKind;
	userMessageKey: string;
	userMessage?: string;
	description?: string;
	fieldErrors?: Record<string, string>;
	original: unknown;
};

function isFetchNetworkError(err: unknown): boolean {
	if (err instanceof TypeError) {
		const msg = err.message.toLowerCase();
		return msg.includes('failed to fetch') || msg.includes('networkerror');
	}
	return false;
}

function getStatusLike(err: unknown): number | undefined {
	if (!err || typeof err !== 'object') return undefined;
	const anyErr = err as Record<string, unknown>;
	const status = anyErr.status;
	return typeof status === 'number' ? status : undefined;
}

function extractZodLikeFieldErrors(err: unknown): Record<string, string> | undefined {
	if (!err || typeof err !== 'object') return undefined;
	const anyErr = err as Record<string, unknown>;
	const issues = anyErr.issues;
	if (!Array.isArray(issues)) return undefined;
	const out: Record<string, string> = {};
	for (const issue of issues) {
		if (!issue || typeof issue !== 'object') continue;
		const i = issue as Record<string, unknown>;
		const path = Array.isArray(i.path) ? i.path.map(String).join('.') : undefined;
		const msg = typeof i.message === 'string' ? i.message : undefined;
		if (path && msg) out[path] = msg;
	}
	return Object.keys(out).length ? out : undefined;
}

function getMessageLike(err: unknown): string | undefined {
	if (!err || typeof err !== 'object') return undefined;
	const anyErr = err as Record<string, unknown>;
	return typeof anyErr.message === 'string' ? anyErr.message : undefined;
}

export function normalizeError(err: unknown): NormalizedError {
	const status = getStatusLike(err);
	const message = getMessageLike(err);
	const zodErrors = extractZodLikeFieldErrors(err);

	// 调试：始终在控制台记录原始错误
	console.error('[ErrorNormalization]', err);

	if (
		isFetchNetworkError(err) ||
		(typeof navigator !== 'undefined' && navigator.onLine === false)
	) {
		return { kind: 'network', userMessageKey: 'toast.network_error', original: err };
	}

	if (zodErrors) {
		return {
			kind: 'validation',
			userMessageKey: 'toast.validation_failed',
			fieldErrors: zodErrors,
			original: err
		};
	}

	if (message) {
		const lower = message.toLowerCase();
		if (lower.includes('invalid login credentials')) {
			return {
				kind: 'auth_invalid_credentials',
				userMessageKey: 'toast.auth_invalid_credentials',
				original: err
			};
		}
		if (lower.includes('email not confirmed')) {
			return {
				kind: 'permission',
				userMessageKey: 'toast.permission_denied',
				original: err
			};
		}
	}

	if (status === 401 || status === 403) {
		return { kind: 'permission', userMessageKey: 'toast.permission_denied', original: err };
	}

	if (status === 404) {
		return { kind: 'not_found', userMessageKey: 'toast.not_found', original: err };
	}

	if (status === 429) {
		return { kind: 'auth_rate_limited', userMessageKey: 'toast.auth_rate_limited', original: err };
	}

	if (status && status >= 500) {
		return { kind: 'server', userMessageKey: 'toast.server_error', original: err };
	}

	return { kind: 'unknown', userMessageKey: 'toast.unknown_error', original: err };
}
