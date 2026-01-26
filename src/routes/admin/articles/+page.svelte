<script lang="ts">
	import {
		Search,
		Plus,
		Filter,
		Pencil,
		Trash2,
		RefreshCw,
		XCircle,
		FileText,
		Tag
	} from 'lucide-svelte';
	import { supabase } from '$lib/supabase';
	import { invalidateAll, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { confirm } from '$lib/feedback/confirm';
	import { notify } from '$lib/feedback/notify';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let statusFilter = $state('全部');
	let categoryFilter = $state('全部');

	let articles = $derived(data.articles);
	let categories = $derived((data.categories as { id: string; name: string }[] | undefined) ?? []);

	let filteredArticles = $derived(
		articles.filter((article) => {
			const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
			const isDeleted = article.status === '已删除';

			const matchesStatus = statusFilter === '全部' ? !isDeleted : article.status === statusFilter;
			const matchesCategory =
				categoryFilter === '全部' ? true : article.category === categoryFilter;

			return matchesSearch && matchesStatus && matchesCategory;
		})
	);

	async function handleSoftDelete(id: string) {
		const ok = await confirm({
			title: '确定要将这篇文章移入回收站吗？',
			description: '文章会进入回收站，可稍后恢复。',
			danger: true,
			confirmText: '移入回收站'
		});
		if (!ok) return;

		const { error } = await supabase
			.from('articles')
			.update({ deleted_at: new Date().toISOString() })
			.eq('id', id);

		if (error) {
			notify.error(error);
		} else {
			const index = articles.findIndex((a) => a.id === id);
			if (index !== -1) {
				articles[index].status = '已删除';
			}
			notify.success('已移入回收站');
		}
	}

	async function handleRestore(id: string) {
		const { error } = await supabase.from('articles').update({ deleted_at: null }).eq('id', id);

		if (error) {
			notify.error(error);
		} else {
			notify.success('已恢复');
			const index = articles.findIndex((a) => a.id === id);
			if (index !== -1) {
				await invalidateAll();
			}
		}
	}

	async function handlePermanentDelete(id: string) {
		const ok = await confirm({
			title: '确定要彻底删除吗？',
			description: '此操作不可恢复。',
			danger: true,
			confirmText: '彻底删除'
		});
		if (!ok) return;

		const { error } = await supabase.from('articles').delete().eq('id', id);

		if (error) {
			notify.error(error);
		} else {
			articles = articles.filter((a) => a.id !== id);
			notify.success('toast.deleted');
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-slate-900">文章管理</h1>
			<p class="text-slate-500 mt-1 text-sm">管理你的博客文章、教程和草稿。</p>
		</div>

		{#if data.isGlobalViewAllowed}
			<div class="flex items-center bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
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

		<div class="flex gap-3">
			<a
				href={resolve('/admin/articles/new')}
				class="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center space-x-2 shadow-sm text-sm"
			>
				<Plus size={18} />
				<span>新建文章</span>
			</a>
		</div>
	</div>

	<!-- Toolbar -->
	<div
		class="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-2 items-center justify-between"
	>
		<div class="relative w-full md:w-80">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="搜索文章标题..."
				class="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-sm"
			/>
		</div>
		<div class="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
			<!-- Status Filter -->
			<div
				class="flex items-center space-x-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 shrink-0"
			>
				<Filter size={16} />
				<span class="text-xs">状态:</span>
				<select
					bind:value={statusFilter}
					class="bg-transparent border-none outline-none focus:ring-0 cursor-pointer text-slate-900 font-bold py-0 pl-1 pr-6"
				>
					<option value="全部">全部</option>
					<option value="已发布">已发布</option>
					<option value="草稿">草稿</option>
					<option value="已删除" class="text-red-500">回收站</option>
				</select>
			</div>

			<!-- Category Filter -->
			<div
				class="flex items-center space-x-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 shrink-0"
			>
				<Tag size={16} />
				<span class="text-xs">分类:</span>
				<select
					bind:value={categoryFilter}
					class="bg-transparent border-none outline-none focus:ring-0 cursor-pointer text-slate-900 font-bold py-0 pl-1 pr-6 max-w-[120px] truncate"
				>
					<option value="全部">全部</option>
					{#each categories as c (c.id)}
						<option value={c.name}>{c.name}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>

	<!-- Table -->
	<div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-left border-collapse">
				<thead>
					<tr
						class="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold"
					>
						<th class="px-6 py-4 w-1/3">文章标题</th>
						<th class="px-6 py-4">分类</th>
						<th class="px-6 py-4">作者</th>
						<th class="px-6 py-4">状态</th>
						<th class="px-6 py-4">发布日期</th>
						<th class="px-6 py-4 text-right">操作</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each filteredArticles as article (article.id)}
						<tr class="group hover:bg-slate-50 transition-colors">
							<td class="px-6 py-4">
								<div class="font-bold text-slate-900 text-sm">{article.title}</div>
							</td>
							<td class="px-6 py-4">
								<div class="flex items-center gap-1">
									<Tag size={14} class="text-slate-400" />
									<span class="text-sm text-slate-600 font-medium">
										{article.category}
									</span>
								</div>
							</td>
							<td class="px-6 py-4 text-sm text-slate-600">
								<div class="flex items-center gap-2">
									{#if article.author_avatar}
										<img
											src={article.author_avatar}
											alt={article.author}
											class="w-6 h-6 rounded-full object-cover bg-slate-200"
										/>
									{:else}
										<div
											class="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500"
										>
											{article.author.charAt(0).toUpperCase()}
										</div>
									{/if}
									<span class="text-xs">{article.author}</span>
								</div>
							</td>
							<td class="px-6 py-4">
								<span
									class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1.5"
									class:bg-emerald-50={article.status === '已发布'}
									class:text-emerald-700={article.status === '已发布'}
									class:border-emerald-100={article.status === '已发布'}
									class:bg-slate-50={article.status === '草稿'}
									class:text-slate-600={article.status === '草稿'}
									class:border-slate-200={article.status === '草稿'}
									class:bg-red-50={article.status === '已删除'}
									class:text-red-700={article.status === '已删除'}
									class:border-red-100={article.status === '已删除'}
								>
									<span
										class="w-1.5 h-1.5 rounded-full {article.status === '已发布'
											? 'bg-emerald-500'
											: article.status === '已删除'
												? 'bg-red-500'
												: 'bg-slate-400'}"
									></span>
									{article.status}
								</span>
							</td>
							<td class="px-6 py-4 text-xs text-slate-500 font-mono">
								{article.date}
							</td>
							<td class="px-6 py-4 text-right">
								<div
									class="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity"
								>
									{#if article.status === '已删除'}
										<button
											onclick={() => handleRestore(article.id)}
											class="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
											title="恢复文章"
										>
											<RefreshCw size={16} />
										</button>
										<button
											onclick={() => handlePermanentDelete(article.id)}
											class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
											title="彻底删除"
										>
											<XCircle size={16} />
										</button>
									{:else}
										<a
											href={resolve(`/admin/articles/${article.id}`)}
											class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
											title="编辑"
										>
											<Pencil size={16} />
										</a>
										<button
											onclick={() => handleSoftDelete(article.id)}
											class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
											title="移入回收站"
										>
											<Trash2 size={16} />
										</button>
									{/if}
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="6" class="px-6 py-16 text-center text-slate-500 text-sm">
								<div class="flex flex-col items-center gap-2">
									<div class="p-3 bg-slate-50 rounded-full">
										<FileText size={24} class="text-slate-300" />
									</div>
									<p>没有找到匹配的文章</p>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
