<script lang="ts">
	import ProjectForm from '$lib/components/admin/ProjectForm.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { supabase } from '$lib/supabase';
	import { notify } from '$lib/feedback/notify';
	import { ArrowLeft } from 'lucide-svelte';

	let project = $state({
		title: '',
		slug: '',
		description: '',
		long_description: '',
		cover_image: '',
		tags: [],
		demo_url: '',
		repo_url: '',
		year: new Date().getFullYear(),
		published: false,
		display_order: 10,
		client: 'Personal'
	});

	let isSaving = $state(false);

	async function handleSave(formData: any) {
		isSaving = true;
		const toastId = notify.loading('正在创建项目...', { description: `${formData.title}` });

		try {
			const {
				data: { user }
			} = await supabase.auth.getUser();

			const payload = {
				...formData,
				created_by: user?.id,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};

			const { error } = await supabase.from('projects').insert(payload);

			if (error) throw error;

			notify.success('项目创建成功', { id: toastId });
			goto(resolve('/admin/projects'));
		} catch (error: any) {
			notify.error(error.message || '创建失败，请稍后重试', { id: toastId, mode: 'manual' });
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="mb-8 flex items-center justify-between">
	<div class="space-y-1">
		<a
			href={resolve('/admin/projects')}
			class="inline-flex items-center gap-2 text-slate-500 hover:text-brand transition-colors text-sm font-medium mb-2"
		>
			<ArrowLeft size={16} />
			返回项目列表
		</a>
		<h1 class="text-3xl font-bold text-slate-900 tracking-tight">新增项目</h1>
		<p class="text-slate-500">展示你的新灵感或最近的作品</p>
	</div>
</div>

<ProjectForm bind:project {isSaving} onSave={handleSave} />
