<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		Search,
		Plus,
		Trash2,
		Pencil,
		Filter,
		RefreshCw,
		XCircle,
		Globe,
		Github
	} from 'lucide-svelte';
	import { supabase } from '$lib/supabase';
	import { confirm } from '$lib/feedback/confirm';
	import { notify } from '$lib/feedback/notify';
	import { invalidateAll, goto } from '$app/navigation';

	interface ProjectItem {
		id: string;
		title: string;
		client: string;
		year: number;
		tags: string[];
		cover_image?: string;
		status: '已发布' | '草稿' | '已删除';
		demo_url?: string;
		repo_url?: string;
		display_order: number;
		author_name: string;
		author_avatar: string;
	}

	let { data } = $props();
	let searchQuery = $state('');
	let statusFilter = $state('全部');

	let projects = $derived(data.projects as ProjectItem[]);

	let filteredProjects = $derived(
		projects.filter((item) => {
			const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
			const isDeleted = item.status === '已删除';
			const matchesStatus = statusFilter === '全部' ? !isDeleted : item.status === statusFilter;
			return matchesSearch && matchesStatus;
		})
	);

	async function handleSoftDelete(id: string) {
		const ok = await confirm({
			title: '确定要删除这个项目吗？',
			description: '该项目将移入回收站，可在列表筛选回收站中查看。',
			danger: true,
			confirmText: '移入回收站'
		});
		if (!ok) return;

		const { error } = await supabase
			.from('projects')
			.update({ deleted_at: new Date().toISOString() })
			.eq('id', id);

		if (error) {
			notify.error(error);
			return;
		}

		notify.success('已移入回收站');
		await invalidateAll();
	}

	async function handleRestore(id: string) {
		const { error } = await supabase.from('projects').update({ deleted_at: null }).eq('id', id);

		if (error) {
			notify.error(error);
		} else {
			notify.success('已从回收站恢复');
			await invalidateAll();
		}
	}

	async function handlePermanentDelete(id: string) {
		const ok = await confirm({
			title: '彻底删除项目？',
			description: '此操作将永久删除项目数据且不可恢复。',
			danger: true,
			confirmText: '彻底删除'
		});
		if (!ok) return;

		const { error } = await supabase.from('projects').delete().eq('id', id);

		if (error) {
			notify.error(error);
		} else {
			notify.success('项目已永久删除');
			await invalidateAll();
		}
	}
</script>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-slate-900 tracking-tight">项目管理</h1>
			<p class="text-slate-500 mt-1">管理你的作品集作品、案例研究与实验室项目。</p>
		</div>

		{#if data.isGlobalViewAllowed}
			<div
				class="flex items-center bg-white p-1 rounded-lg border border-slate-200 shadow-sm self-start sm:self-auto"
			>
				<button
					onclick={() => {
						const url = new URL(window.location.href);
						url.searchParams.set('scope', 'all');
						goto(url.toString());
					}}
					class="px-3 py-1.5 text-xs font-medium rounded-md transition-all {data.currentScope ===
					'all'
						? 'bg-slate-900 text-white shadow-sm'
						: 'text-slate-500 hover:text-slate-900'}"
				>
					查看全部
				</button>
				<button
					onclick={() => {
						const url = new URL(window.location.href);
						url.searchParams.set('scope', 'mine');
						goto(url.toString());
					}}
					class="px-3 py-1.5 text-xs font-medium rounded-md transition-all {data.currentScope ===
					'mine'
						? 'bg-slate-900 text-white shadow-sm'
						: 'text-slate-500 hover:text-slate-900'}"
				>
					只看我的
				</button>
			</div>
		{/if}

		<a
			href={resolve('/admin/projects/new')}
			class="px-5 py-2.5 bg-brand text-white font-bold rounded-xl hover:bg-brand-light transition-all flex items-center justify-center space-x-2 shadow-lg shadow-brand/20 active:scale-95"
		>
			<Plus size={20} />
			<span>添加项目</span>
		</a>
	</div>

	<!-- Search & Filters -->
	<div
		class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between"
	>
		<div class="relative w-full md:w-96 group">
			<Search
				class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors"
				size={18}
			/>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="搜索项目标题..."
				class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none transition-all text-sm"
			/>
		</div>
		<div class="flex items-center space-x-3 w-full md:w-auto">
			<div
				class="flex items-center space-x-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 uppercase tracking-widest"
			>
				<Filter size={14} />
				<span>状态:</span>
				<select
					bind:value={statusFilter}
					class="bg-transparent border-none outline-none focus:ring-0 cursor-pointer text-slate-900 normal-case font-bold"
				>
					<option value="全部">全部 (活跃)</option>
					<option value="已发布">已发布</option>
					<option value="草稿">草稿</option>
					<option value="已删除">🗑️ 回收站</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Projects Table -->
	<div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
		<div class="overflow-x-auto">
			<table class="w-full text-left border-collapse">
				<thead>
					<tr
						class="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-widest text-slate-500 font-bold"
					>
						<th class="px-6 py-4">项目信息</th>
						<th class="px-6 py-4">作者</th>
						<th class="px-6 py-4">客户 / 类型</th>
						<th class="px-6 py-4">年份</th>
						<th class="px-6 py-4">状态</th>
						<th class="px-6 py-4">链接</th>
						<th class="px-6 py-4 text-right">操作</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each filteredProjects as item (item.id)}
						<tr class="group hover:bg-slate-50 transition-colors">
							<!-- Title & Thumbnail -->
							<td class="px-6 py-5 min-w-[280px]">
								<div class="flex items-center gap-5">
									<div
										class="w-20 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shadow-sm flex-shrink-0"
									>
										{#if item.cover_image}
											<img
												src={item.cover_image}
												alt={item.title}
												class="w-full h-full object-cover"
											/>
										{:else}
											<div class="w-full h-full flex items-center justify-center">
												<span class="text-[10px] font-bold text-slate-400 uppercase">No Image</span>
											</div>
										{/if}
									</div>
									<div class="flex flex-col">
										<span
											class="text-base font-bold text-slate-900 group-hover:text-brand transition-colors truncate max-w-[240px] leading-snug"
											>{item.title}</span
										>
									</div>
								</div>
							</td>

							<!-- Author -->
							<td class="px-6 py-5 text-sm text-slate-600">
								<div class="flex items-center space-x-2">
									{#if item.author_avatar}
										<img
											src={item.author_avatar}
											alt={item.author_name}
											class="w-6 h-6 rounded-full object-cover bg-slate-200 border border-slate-100 shadow-sm"
										/>
									{:else}
										<div
											class="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500"
										>
											{item.author_name.charAt(0).toUpperCase()}
										</div>
									{/if}
									<span class="font-medium">{item.author_name}</span>
								</div>
							</td>

							<!-- Client -->
							<td class="px-6 py-5 text-sm font-semibold text-slate-600">
								{item.client || 'Personal'}
							</td>

							<!-- Year -->
							<td class="px-6 py-5 text-sm font-mono text-slate-500 font-medium">
								{item.year || '—'}
							</td>

							<!-- Status -->
							<td class="px-6 py-5">
								<span
									class="px-2.5 py-1 rounded-full text-xs font-bold border"
									class:bg-emerald-50={item.status === '已发布'}
									class:text-emerald-700={item.status === '已发布'}
									class:border-emerald-100={item.status === '已发布'}
									class:bg-slate-50={item.status === '草稿'}
									class:text-slate-500={item.status === '草稿'}
									class:border-slate-200={item.status === '草稿'}
									class:bg-red-50={item.status === '已删除'}
									class:text-red-700={item.status === '已删除'}
									class:border-red-100={item.status === '已删除'}
								>
									{item.status}
								</span>
							</td>

							<!-- Links -->
							<td class="px-6 py-4">
								<div class="flex items-center gap-3">
									{#if item.demo_url}
										<a
											href={item.demo_url}
											target="_blank"
											class="text-slate-300 hover:text-sky-500 transition-colors"
											title="Demo"
										>
											<Globe size={16} />
										</a>
									{/if}
									{#if item.repo_url}
										<a
											href={item.repo_url}
											target="_blank"
											class="text-slate-300 hover:text-slate-900 transition-colors"
											title="Repo"
										>
											<Github size={16} />
										</a>
									{/if}
								</div>
							</td>

							<!-- Actions -->
							<td class="px-6 py-4 text-right">
								<div
									class="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity"
								>
									{#if item.status === '已删除'}
										<button
											onclick={() => handleRestore(item.id)}
											class="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
											title="快恢复"
										>
											<RefreshCw size={18} />
										</button>
										<button
											onclick={() => handlePermanentDelete(item.id)}
											class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
											title="彻底删除"
										>
											<XCircle size={18} />
										</button>
									{:else}
										<a
											href={resolve(`/admin/projects/${item.id}`)}
											class="p-2 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-all"
											title="编辑"
										>
											<Pencil size={18} />
										</a>
										<button
											onclick={() => handleSoftDelete(item.id)}
											class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
											title="移入回收站"
										>
											<Trash2 size={18} />
										</button>
									{/if}
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="6" class="px-6 py-20 text-center">
								<div class="flex flex-col items-center justify-center text-slate-400">
									<Search size={40} class="mb-4 opacity-10" />
									<p class="text-sm font-medium">没有找到匹配的项目</p>
									<p class="text-xs mt-1">尝试调整搜索词或筛选条件</p>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
