import type { PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/rbac';

export const load: PageServerLoad = async (event) => {
    // Only Admin and Super Admin can access File Maintenance
    await requireAdmin(event.locals.supabase, event.url.pathname);

    return {};
};
