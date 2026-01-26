<script lang="ts">
	import ArticleForm from '$lib/components/articles/ArticleForm.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { supabase } from '$lib/supabase';
	import { notify } from '$lib/feedback/notify';
	import { extractTrackedPathsFromContent, publicUrlToTrackedPath } from '$lib/utils/fileTracking';
	import type { PageData } from './$types';

	type Category = { id: string; name: string };

	let { data }: { data: PageData } = $props();
	let article = $derived(data.article);
	let categories = $derived(((data as { categories?: Category[] }).categories ?? []) as Category[]);
	let id = $derived(String(article?.id ?? ''));

	let isSaving = $state(false);

	async function handleSave(formData: any) {
		isSaving = true;
		const toastId = notify.loading('保存中...', { description: '正在更新文章内容' });
		try {
			const articleData = {
				...formData,
				updated_at: new Date().toISOString(),
				published_at: formData.published ? new Date().toISOString() : null
			};

			const { error } = await supabase.from('articles').update(articleData).eq('id', id);

			if (error) throw error;

			const filePaths = [
				...(formData.cover_image
					? [publicUrlToTrackedPath(formData.cover_image)].filter(Boolean)
					: []),
				...extractTrackedPathsFromContent(formData.content)
			] as string[];

			await supabase.rpc('bind_uploaded_files', {
				entity_type: 'article',
				entity_id: id,
				keep_file_paths: filePaths
			});

			notify.success('保存成功', { id: toastId });
			goto(resolve('/admin/articles'));
		} catch (error: unknown) {
			notify.error(error, { id: toastId, mode: 'manual' });
		} finally {
			isSaving = false;
		}
	}
</script>

{#if article}
	<ArticleForm {article} {categories} {isSaving} onSave={handleSave} />
{:else}
	<div class="flex items-center justify-center min-h-[60vh]">
		<div
			class="animate-spin rounded-full h-8 w-8 border-2 border-slate-900 border-t-transparent"
		></div>
	</div>
{/if}
