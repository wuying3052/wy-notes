<script lang="ts">
	import ProjectForm from '$lib/components/admin/ProjectForm.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { supabase } from '$lib/supabase';
	import { notify } from '$lib/feedback/notify';
	import type { PageData } from './$types';
	import { ArrowLeft } from 'lucide-svelte';

	import { untrack } from 'svelte';

	let { data }: { data: PageData } = $props();
	let project = $state(untrack(() => data.project));
	let isSaving = $state(false);

	async function handleSave(formData: any) {
		isSaving = true;
		const toastId = notify.loading('正在保存项目...', { description: `${formData.title}` });

		try {
			// Prepare data for Supabase
			const updateData = {
				...formData,
				updated_at: new Date().toISOString()
			};

			// Remove id from update payload as it's the primary key
			const { id, ...payload } = updateData;

			const { error } = await supabase.from('projects').update(payload).eq('id', id);

			if (error) throw error;

			notify.success('更新成功', { id: toastId });
			goto(resolve('/admin/projects'));
		} catch (error: any) {
			notify.error(error.message || '保存失败，请稍后重试', { id: toastId, mode: 'manual' });
		} finally {
			isSaving = false;
		}
	}
</script>

{#if project}
	<ProjectForm bind:project {isSaving} onSave={handleSave} />
{:else}
	<div class="flex flex-col items-center justify-center min-h-[60vh]">
		<div
			class="animate-spin rounded-full h-8 w-8 border-2 border-slate-900 border-t-transparent"
		></div>
	</div>
{/if}
