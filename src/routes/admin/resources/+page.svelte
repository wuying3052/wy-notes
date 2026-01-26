<script lang="ts">
	import { resolve } from '$app/paths';
	import { Search, Plus, Filter, ExternalLink, Trash2, Pencil } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';
	import { confirm } from '$lib/feedback/confirm';
	import { notify } from '$lib/feedback/notify';
	import { supabase } from '$lib/supabase';

	let { data } = $props();
	type ResourceItem = {
		id: string;
		title: string;
		description: string | null;
		category: string | null;
		category_id?: string | null;
		category_name?: string | null;
		url: string;
	};
	let resources = $derived((data.resources as ResourceItem[] | undefined) ?? []);

	let hiddenIds = $state<string[]>([]);

	let searchQuery = $state('');
	let categoryFilter = $state('全部');

	function categoryLabel(item: ResourceItem): string {
		return item.category_name ?? item.category ?? '未分类';
	}

	let visibleResources = $derived(resources.filter((r) => !hiddenIds.includes(r.id)));

	// 从资源列表中动态提取所有分类，并去重
	let categories = $derived.by(() => {
		const unique: string[] = [];
		for (const r of visibleResources) {
			const label = categoryLabel(r);
			if (!unique.includes(label)) unique.push(label);
		}
		unique.sort();
		return ['全部', ...unique];
	});

	let filteredResources = $derived(
		visibleResources.filter((item: ResourceItem) => {
			const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesCategory = categoryFilter === '全部' || categoryLabel(item) === categoryFilter;
			return matchesSearch && matchesCategory;
		})
	);

	async function handleDelete(id: string) {
		const ok = await confirm({
			title: '确定要删除这个资源吗？',
			danger: true,
			confirmText: '删除'
		});
		if (!ok) return;
		const { error } = await supabase
			.from('resources')
			.update({ deleted_at: new Date().toISOString() })
			.eq('id', id);

		if (error) {
			notify.error(error);
			return;
		}

		hiddenIds = [...hiddenIds, id];
		notify.success('toast.deleted');
		await invalidateAll();
	}
</script>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-slate-900">资源管理</h1>
			<p class="text-slate-500 mt-1">管理前台展示的工具和链接资源。</p>
		</div>
		<div class="flex gap-3">
			<a
				href={resolve('/admin/resources/new')}
				class="px-5 py-2.5 bg-brand text-white font-bold rounded-xl hover:bg-brand-light transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-brand/20"
			>
				<Plus size={20} />
				<span>添加资源</span>
			</a>
		</div>
	</div>

	<div
		class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between"
	>
		<div class="relative w-full md:w-96">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="搜索资源名称..."
				class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
			/>
		</div>
		<div class="flex items-center space-x-3 w-full md:w-auto">
			<div
				class="flex items-center space-x-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700"
			>
				<Filter size={16} />
				<span>分类:</span>
				<select
					bind:value={categoryFilter}
					class="bg-transparent border-none outline-none focus:ring-0 cursor-pointer min-w-[100px]"
				>
					{#each categories as cat (cat)}
						<option value={cat}>{cat}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>

	<div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-left border-collapse">
				<thead>
					<tr
						class="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold"
					>
						<th class="px-6 py-4">资源名称</th>
						<th class="px-6 py-4">分类</th>
						<th class="px-6 py-4">链接</th>
						<th class="px-6 py-4 text-right">操作</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each filteredResources as res (res.id)}
						<tr class="group hover:bg-slate-50 transition-colors">
							<td class="px-6 py-4">
								<div class="flex items-start space-x-3">
									<div
										class="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm p-1.5"
									>
										<img
											src={`https://www.google.com/s2/favicons?domain=${res.url}&sz=64`}
											alt={res.title}
											class="w-full h-full object-contain"
											onerror={(e) => {
												const img = e.currentTarget as HTMLImageElement;
												img.src =
													'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNiIgZmlsbD0iI2YxZjVmOSIvPjwvc3ZnPg==';
											}}
										/>
									</div>
									<div>
										<div class="font-bold text-slate-900">{res.title}</div>
										<div class="text-xs text-slate-400">{res.description}</div>
									</div>
								</div>
							</td>
							<td class="px-6 py-4">
								<span
									class="px-2.5 py-0.5 rounded-full text-xs font-bold border border-slate-200 bg-slate-50 text-slate-600"
								>
									{categoryLabel(res)}
								</span>
							</td>
							<td class="px-6 py-4">
								<a
									href={res.url}
									target="_blank"
									rel="external noopener noreferrer"
									class="text-brand hover:underline flex items-center space-x-1 text-sm"
								>
									<span>{res.url}</span>
									<ExternalLink size={12} />
								</a>
							</td>
							<td class="px-6 py-4 text-right">
								<div
									class="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity"
								>
									<a
										href={resolve(`/admin/resources/${res.id}`)}
										class="p-2 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
										title="编辑"
									>
										<Pencil size={18} />
									</a>
									<button
										onclick={() => handleDelete(res.id)}
										class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
									>
										<Trash2 size={18} />
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
