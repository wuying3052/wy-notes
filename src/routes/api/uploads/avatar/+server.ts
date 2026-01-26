import { error, json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';

function isLegacyJwtServiceKey(value: string) {
	return value.startsWith('eyJ') && value.split('.').length === 3;
}

function safeExt(name: string) {
	const parts = name.split('.');
	if (parts.length < 2) return 'bin';
	const ext = parts.at(-1)?.toLowerCase() ?? 'bin';
	return ext.replace(/[^a-z0-9]/g, '').slice(0, 10) || 'bin';
}

function randomId() {
	return Math.random().toString(36).slice(2);
}

export async function POST(event) {
	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();

	if (!user) throw error(401, '操作失败');
	if (!env.SUPABASE_SERVICE_ROLE_KEY) throw error(500, '操作失败');
	if (!isLegacyJwtServiceKey(env.SUPABASE_SERVICE_ROLE_KEY)) {
		throw error(500, '操作失败');
	}

	const form = await event.request.formData();
	const file = form.get('file');
	if (!(file instanceof File)) throw error(400, '操作失败');

	const bucket = 'wyNotes';
	const objectPath = `avatars/${user.id}/${randomId()}_${Date.now()}.${safeExt(file.name)}`;
	const bytes = new Uint8Array(await file.arrayBuffer());

	const supabase = createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
		auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
	});

	const { error: uploadError } = await supabase.storage.from(bucket).upload(objectPath, bytes, {
		contentType: file.type || 'application/octet-stream',
		upsert: false
	});
	if (uploadError) throw error(400, '操作失败');

	const {
		data: { publicUrl }
	} = supabase.storage.from(bucket).getPublicUrl(objectPath);

	// uploaded_files 废弃，不再写入

	return json({ ok: true, publicUrl });
}
