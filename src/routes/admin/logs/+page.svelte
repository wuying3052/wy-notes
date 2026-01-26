<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { Clock, User, FileText, Filter, ChevronLeft, ChevronRight } from 'lucide-svelte';

	let { data } = $props();

	const actionTypes = ['CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'PURGE'];
	const entityTypes = ['articles', 'projects', 'resources', 'comments'];

	let selectedAction = $state($page.url.searchParams.get('action') || '');
	let selectedEntityType = $state($page.url.searchParams.get('entity_type') || '');
	let q = $state($page.url.searchParams.get('q') || '');
	let user = $state($page.url.searchParams.get('user') || '');

	function applyFilters() {
		const params = new SvelteURLSearchParams();
		if (selectedAction) params.set('action', selectedAction);
		if (selectedEntityType) params.set('entity_type', selectedEntityType);
		if (q.trim()) params.set('q', q.trim());
		if (user.trim()) params.set('user', user.trim());
		params.set('page', '1');
		goto(resolve(`/admin/logs?${params.toString()}`));
	}

	function clearFilters() {
		selectedAction = '';
		selectedEntityType = '';
		q = '';
		user = '';
		goto(resolve('/admin/logs'));
	}

	function goToPage(pageNum: number) {
		const params = new SvelteURLSearchParams();
		$page.url.searchParams.forEach((value, key) => params.set(key, value));
		params.set('page', pageNum.toString());
		goto(resolve(`/admin/logs?${params.toString()}`));
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	function getActionColor(action: string) {
		const colors: Record<string, string> = {
			CREATE: 'bg-emerald-100 text-emerald-700',
			UPDATE: 'bg-blue-100 text-blue-700',
			DELETE: 'bg-red-100 text-red-700',
			RESTORE: 'bg-purple-100 text-purple-700',
			PURGE: 'bg-slate-800 text-white'
		};
		return colors[action] || 'bg-slate-100 text-slate-700';
	}

	const totalPages = $derived(Math.ceil(data.total / data.limit));
	const hasFilters = $derived(selectedAction || selectedEntityType || q.trim() || user.trim());
</script>

<div class="min-h-screen bg-slate-50 p-6">
	<div class="max-w-7xl mx-auto">
		<!-- 页头 -->
		<div class="mb-6">
			<h1 class="text-2xl font-bold text-slate-900">操作日志</h1>
			<p class="text-slate-600 mt-1">查看系统操作审计记录</p>
		</div>

		<!-- 筛选器 -->
		<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
			<div class="flex items-center gap-2 mb-3">
				<Filter size={18} class="text-slate-400" />
				<span class="font-medium text-slate-700">筛选条件</span>
			</div>

			<div class="flex flex-wrap gap-3">
				<input
					type="text"
					bind:value={q}
					placeholder="搜索 action / entity_type / entity_id(完整UUID)"
					class="min-w-[260px] px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
				/>
				<input
					type="text"
					bind:value={user}
					placeholder="筛选用户邮箱"
					class="min-w-[200px] px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
				/>
				<select
					bind:value={selectedAction}
					class="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
				>
					<option value="">所有操作类型</option>
					{#each actionTypes as action (action)}
						<option value={action}>{action}</option>
					{/each}
				</select>

				<select
					bind:value={selectedEntityType}
					class="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
				>
					<option value="">所有实体类型</option>
					{#each entityTypes as type (type)}
						<option value={type}>{type}</option>
					{/each}
				</select>

				<button
					onclick={applyFilters}
					class="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
				>
					应用筛选
				</button>

				{#if hasFilters}
					<button
						onclick={clearFilters}
						class="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
					>
						清除筛选
					</button>
				{/if}
			</div>
		</div>

		<!-- 统计信息 -->
		<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
			<p class="text-sm text-slate-600">
				共 <span class="font-semibold text-slate-900">{data.total}</span> 条记录
				{#if hasFilters}
					<span class="text-slate-400">(已筛选)</span>
				{/if}
			</p>
		</div>

		<!-- 日志列表 -->
		<div class="space-y-3">
			{#if data.logs.length === 0}
				<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
					<p class="text-slate-500">暂无操作日志</p>
				</div>
			{:else}
				{#each data.logs as log (log.id)}
					<div
						class="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:border-slate-300 transition-colors"
					>
						<div class="flex items-start justify-between gap-4">
							<div class="flex-1 min-w-0">
								<!-- 操作类型和实体 -->
								<div class="flex items-center gap-2 mb-2">
									<span
										class="px-2 py-1 rounded-lg text-xs font-medium {getActionColor(log.action)}"
									>
										{log.action}
									</span>
									<span class="text-slate-600 text-sm flex items-center gap-1">
										<FileText size={14} />
										{log.entity_type}
									</span>
									{#if log.entity_id}
										<span class="text-xs text-slate-400 font-mono">
											{log.entity_id.slice(0, 8)}...
										</span>
									{/if}
								</div>

								<!-- 用户和时间 -->
								<div class="flex items-center gap-4 text-sm text-slate-500">
									<span class="flex items-center gap-1">
										<User size={14} />
										{log.user?.display_name || log.user?.email || '系统'}
									</span>
									<span class="flex items-center gap-1">
										<Clock size={14} />
										{formatDate(log.created_at)}
									</span>
									{#if log.ip_address}
										<span class="text-xs text-slate-400">
											IP: {log.ip_address}
										</span>
									{/if}
								</div>

								<!-- 详情 (可展开) -->
								{#if log.details}
									<details class="mt-3">
										<summary
											class="cursor-pointer text-sm text-brand hover:text-brand/80 font-medium"
										>
											查看详情
										</summary>
										<pre
											class="mt-2 p-3 bg-slate-50 rounded-lg text-xs overflow-x-auto border border-slate-200">
{JSON.stringify(log.details, null, 2)}
										</pre>
									</details>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<!-- 分页 -->
		{#if totalPages > 1}
			<div class="mt-6 flex items-center justify-center gap-2">
				<button
					onclick={() => goToPage(data.page - 1)}
					disabled={data.page === 1}
					class="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					<ChevronLeft size={20} />
				</button>

				<div class="flex items-center gap-1">
					{#each Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
						let pageNum;
						if (totalPages <= 5) {
							pageNum = i + 1;
						} else if (data.page <= 3) {
							pageNum = i + 1;
						} else if (data.page >= totalPages - 2) {
							pageNum = totalPages - 4 + i;
						} else {
							pageNum = data.page - 2 + i;
						}
						return pageNum;
					}) as pageNum (pageNum)}
						<button
							onclick={() => goToPage(pageNum)}
							class="w-10 h-10 rounded-lg border transition-colors {pageNum === data.page
								? 'bg-slate-900 text-white border-slate-900'
								: 'border-slate-200 hover:bg-slate-50'}"
						>
							{pageNum}
						</button>
					{/each}
				</div>

				<button
					onclick={() => goToPage(data.page + 1)}
					disabled={data.page === totalPages}
					class="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					<ChevronRight size={20} />
				</button>
			</div>

			<p class="text-center text-sm text-slate-500 mt-3">
				第 {data.page} / {totalPages} 页
			</p>
		{/if}
	</div>
</div>
