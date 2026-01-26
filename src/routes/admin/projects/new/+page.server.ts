import type { RequestEvent } from '@sveltejs/kit';
import { requireActiveRole } from '$lib/server/rbac';

export const load = async (event: RequestEvent) => {
    await requireActiveRole(event.locals.supabase, event.url.pathname);
    return {};
};
