import { json, error as kitError } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';
import { supabase } from '$lib/supabase';
import { extractTrackedPathsFromContent, publicUrlToTrackedPath } from '$lib/utils/fileTracking';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
    // 1. 权限校验
    const { data: { user } } = await locals.supabase.auth.getUser();
    if (!user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 这里简单校验是否为管理员，根据您的 RBAC 逻辑可能需要调整
    // 假设 profiles 表有 role 字段
    const { data: profile } = await locals.supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

    if (profile?.role !== 'super_admin' && profile?.role !== 'admin') {
        return json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
        return json({ error: 'Service role key missing' }, { status: 500 });
    }

    const adminClient = createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });

    try {
        // 2. 获取“客观存在”：列出存储桶中所有文件
        const bucketName = 'wyNotes';
        const allFiles: string[] = [];

        async function listAllFiles(path = '') {
            const { data, error } = await adminClient.storage
                .from(bucketName)
                .list(path, { limit: 1000 });

            if (error) {
                console.error(`[Cleanup] Error listing path "${path}":`, error);
                throw error;
            }

            if (!data) return;

            for (const item of data) {
                if (!item.id) {
                    // 没有 id 的是文件夹
                    await listAllFiles(path ? `${path}/${item.name}` : item.name);
                } else {
                    // 有 id 的是文件
                    const fullPath = path ? `${path}/${item.name}` : item.name;
                    allFiles.push(fullPath);
                }
            }
        }

        await listAllFiles();

        // 3. 获取“实际使用”：扫描数据库内容
        const usedFiles = new Set<string>();

        // 3.1 扫描 Articles (content, cover_image)
        const { data: articles } = await locals.supabase
            .from('articles')
            .select('content, cover_image');

        if (articles) {
            for (const article of articles) {
                if (article.cover_image) {
                    const path = publicUrlToTrackedPath(article.cover_image);
                    if (path) usedFiles.add(path);
                }
                const paths = extractTrackedPathsFromContent(article.content || '');
                paths.forEach(p => usedFiles.add(p));
            }
        }

        // 3.2 扫描 Projects (description, long_description, cover_image)
        const { data: projects } = await locals.supabase
            .from('projects')
            .select('description, long_description, cover_image');

        if (projects) {
            for (const project of projects) {
                if (project.cover_image) {
                    const path = publicUrlToTrackedPath(project.cover_image);
                    if (path) usedFiles.add(path);
                }
                const pathsDesc = extractTrackedPathsFromContent(project.description || '');
                pathsDesc.forEach(p => usedFiles.add(p));
                const pathsLong = extractTrackedPathsFromContent(project.long_description || '');
                pathsLong.forEach(p => usedFiles.add(p));
            }
        }

        // 3.3 扫描 Profiles (avatar_url) - 防止误删头像
        const { data: profiles } = await locals.supabase
            .from('profiles')
            .select('avatar_url');

        if (profiles) {
            for (const p of profiles) {
                if (p.avatar_url) {
                    const path = publicUrlToTrackedPath(p.avatar_url);
                    if (path) usedFiles.add(path);
                }
            }
        }

        // 4. 计算孤儿文件
        // usedFiles 中的路径格式为 "bucket/path/to/file"，需要去掉 bucket 前缀才能与 allFiles (相对路径) 比对
        const usedPathsRelative = new Set<string>();
        for (const fullPath of usedFiles) {
            // fullPath ex: "wyNotes/articles/image.png"
            if (fullPath.startsWith(bucketName + '/')) {
                usedPathsRelative.add(fullPath.slice(bucketName.length + 1));
            }
        }

        // Orphans = BucketFiles - UsedFiles
        const orphanFiles = allFiles.filter(file => !usedPathsRelative.has(file));

        // 5. 执行清理 (如果带有 ?execute=true 参数)
        // 实际上，为了安全，建议分两步：先预览，再确认为 delete
        // 这里简化为：前端调用时传 action='scan' 或 'delete'

        // 我们简单处理：返回孤儿列表，前端确认后再调另一个接口删除，或者直接在这里根据参数删除
        // 鉴于这是一个 Server Action，我们假设前端会负责 confirm UI

        // 暂时只做扫描返回，删除逻辑需要更谨慎，或者我们可以支持一个 json body { action: 'delete', files: [...] }
        // 为了方便，本例实现为：如果不传 body，则只扫描。如果传 { execute: true }，则删除扫描到的所有孤儿。

        return json({
            totalFiles: allFiles.length,
            usedFiles: usedPathsRelative.size,
            orphanCount: orphanFiles.length,
            orphans: orphanFiles
        });

    } catch (err: any) {
        console.error('Cleanup error:', err);
        return json({ error: err.message }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
    // 1. 权限校验
    const { data: { user } } = await locals.supabase.auth.getUser();
    if (!user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await locals.supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

    if (profile?.role !== 'super_admin' && profile?.role !== 'admin') {
        return json({ error: 'Forbidden' }, { status: 403 });
    }

    const { files } = await request.json();
    if (!files || !Array.isArray(files) || files.length === 0) {
        return json({ message: 'No files to delete' });
    }

    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
        return json({ error: 'Service role key missing' }, { status: 500 });
    }

    const adminClient = createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });

    const bucketName = 'wyNotes';
    const { data, error } = await adminClient.storage
        .from(bucketName)
        .remove(files);

    if (error) {
        return json({ error: error.message }, { status: 500 });
    }

    return json({ success: true, deleted: data });
}
