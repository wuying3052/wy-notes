import { json } from '@sveltejs/kit';
import { requireActiveRole } from '$lib/server/rbac';
import type { RequestHandler } from './$types';
import { getPublicUrl } from '$lib/utils/file';

function safeExt(name: string) {
    const parts = name.split('.');
    if (parts.length < 2) return 'bin';
    const ext = parts.at(-1)?.toLowerCase() ?? 'bin';
    return ext.replace(/[^a-z0-9]/g, '').slice(0, 10) || 'bin';
}

function randomId() {
    return Math.random().toString(36).slice(2);
}

export const POST: RequestHandler = async ({ request, locals }) => {
    await requireActiveRole(locals.supabase, '/admin/articles');

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
        return json({ error: 'No file uploaded' }, { status: 400 });
    }

    try {
        const bucket = 'wyNotes';
        const fileExt = safeExt(file.name);
        const fileName = `${randomId()}_${Date.now()}.${fileExt}`;
        const filePath = `articles/${fileName}`;

        const { error: uploadError } = await locals.supabase.storage
            .from(bucket)
            .upload(filePath, file);

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            return json({ error: 'Upload failed' }, { status: 500 });
        }

        const url = getPublicUrl(filePath);

        // uploaded_files 表已弃用，不再写入

        return json({ url });
    } catch (err) {
        console.error('Upload error:', err);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};
