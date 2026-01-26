<script lang="ts">
	import ArticleForm from '$lib/components/articles/ArticleForm.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { supabase } from '$lib/supabase';
	import { notify } from '$lib/feedback/notify';
	import { extractTrackedPathsFromContent, publicUrlToTrackedPath } from '$lib/utils/fileTracking';

	type Category = { id: string; name: string };
	let { data } = $props();
	let categories = $derived(((data as { categories?: Category[] }).categories ?? []) as Category[]);

	let isSaving = $state(false);

	async function handleSave(formData: any) {
		isSaving = true;
		const toastId = notify.loading('保存中...', { description: '正在创建文章' });
		try {
			const {
				data: { user }
			} = await supabase.auth.getUser();
			if (!user) {
				notify.error('用户未登录，请先登录');
				return;
			}

			const articleData = {
				...formData,
				updated_at: new Date().toISOString(),
				published_at: formData.published ? new Date().toISOString() : null
			};

			const { data: inserted, error } = await supabase
				.from('articles')
				.insert(articleData)
				.select('id')
				.single();

			if (error) throw error;

			const filePaths = [
				...(formData.cover_image
					? [publicUrlToTrackedPath(formData.cover_image)].filter(Boolean)
					: []),
				...extractTrackedPathsFromContent(formData.content)
			] as string[];

			if (filePaths.length && inserted?.id) {
				await supabase.rpc('bind_uploaded_files', {
					entity_type: 'article',
					entity_id: inserted.id,
					keep_file_paths: filePaths
				});
			}

			notify.success('保存成功', { id: toastId });
			goto(resolve('/admin/articles'));
		} catch (error: unknown) {
			notify.error(error, { id: toastId, mode: 'manual' });
		} finally {
			isSaving = false;
		}
	}
</script>

<ArticleForm {categories} {isSaving} onSave={handleSave} />
