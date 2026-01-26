import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { requireActiveRole } from '$lib/server/rbac';

export const load: PageServerLoad = async (event) => {
    // Only admins/super_admins can manage categories
    await requireActiveRole(event.locals.supabase, event.url.pathname);

    const { data: categories, error } = await event.locals.supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching categories:', error);
        return { categories: [] };
    }

    return {
        categories: categories ?? []
    };
};

export const actions: Actions = {
    create: async (event) => {
        await requireActiveRole(event.locals.supabase, event.url.pathname);
        const formData = await event.request.formData();
        const name = formData.get('name') as string;
        const kind = formData.get('kind') as string;

        if (!name || !kind) {
            return fail(400, { message: '名称和类型不能为空' });
        }

        const { error } = await event.locals.supabase
            .from('categories')
            .insert({ name, kind });

        if (error) {
            console.error('Create category error:', error);
            if (error.code === '23505') { // Unique violation
                return fail(400, { message: '该分类名称已存在' });
            }
            return fail(500, { message: '创建失败: ' + error.message });
        }

        return { success: true };
    },

    update: async (event) => {
        await requireActiveRole(event.locals.supabase, event.url.pathname);
        const formData = await event.request.formData();
        const id = formData.get('id') as string;
        const name = formData.get('name') as string;

        if (!id || !name) {
            return fail(400, { message: 'ID和名称不能为空' });
        }

        const { error } = await event.locals.supabase
            .from('categories')
            .update({ name })
            .eq('id', id);

        if (error) {
            console.error('Update category error:', error);
            if (error.code === '23505') {
                return fail(400, { message: '该分类名称已存在' });
            }
            return fail(500, { message: '更新失败: ' + error.message });
        }

        return { success: true };
    },

    delete: async (event) => {
        await requireActiveRole(event.locals.supabase, event.url.pathname);
        const formData = await event.request.formData();
        const id = formData.get('id') as string;

        if (!id) {
            return fail(400, { message: 'ID不能为空' });
        }

        const { error } = await event.locals.supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Delete category error:', error);
            // Check foreign key constraint violation (if any)
            if (error.code === '23503') {
                return fail(400, { message: '无法删除：该分类仍被文章或资源引用' });
            }
            return fail(500, { message: '删除失败: ' + error.message });
        }

        return { success: true };
    }
};
