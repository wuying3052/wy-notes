<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import {
		File,
		Image,
		Video,
		FileText,
		Filter,
		Trash2,
		AlertTriangle,
		ChevronLeft,
		ChevronRight,
		ExternalLink,
		Copy,
		ArrowUpDown,
		Database,
		Layers,
		Search,
		ShieldAlert,
		ListFilter
	} from 'lucide-svelte';
	import { confirm } from '$lib/feedback/confirm';
	import { notify } from '$lib/feedback/notify';
	import { getPublicUrl } from '$lib/utils/file';

	let { data } = $props();

	const entityTypes = ['article', 'project', 'resource', 'profile'];
	const knownBuckets = ['wyNotes', 'avatars'];

	let selectedEntityType = $state($page.url.searchParams.get('entity_type') || '');
	let orphanOnly = $state($page.url.searchParams.get('orphan') === 'true');
	let q = $state($page.url.searchParams.get('q') || '');
	let sort = $state($page.url.searchParams.get('sort') || 'created_at');
	let dir = $state($page.url.searchParams.get('dir') || 'desc');
	let cleanupDays = $state(14);
	let isCleaningUp = $state(false);

	function applyFilters() {
		const params = new SvelteURLSearchParams();
		if (selectedEntityType) params.set('entity_type', selectedEntityType);
		if (orphanOnly) params.set('orphan', 'true');
		if (q.trim()) params.set('q', q.trim());
		if (sort) params.set('sort', sort);
		if (dir) params.set('dir', dir);
		params.set('page', '1');
		goto(resolve(`/admin/files?${params.toString()}`));
	}

	function clearFilters() {
		selectedEntityType = '';
		orphanOnly = false;
		q = '';
		sort = 'created_at';
		dir = 'desc';
		goto(resolve('/admin/files'));
	}

	function goToPage(pageNum: number) {
		const params = new SvelteURLSearchParams();
		$page.url.searchParams.forEach((value, key) => params.set(key, value));
		params.set('page', pageNum.toString());
		goto(resolve(`/admin/files?${params.toString()}`));
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatFileSize(bytes: number | null) {
		if (bytes == null) return 'Unknown';
		if (bytes < 1024) return `${bytes} B`;
		const kb = bytes / 1024;
		if (kb < 1024) return `${kb.toFixed(1)} KB`;
		const mb = kb / 1024;
		return `${mb.toFixed(1)} MB`;
	}

	function getFileIcon(mimeType: string | null) {
		if (!mimeType) return File;
		if (mimeType.startsWith('image/')) return Image;
		if (mimeType.startsWith('video/')) return Video;
		return FileText;
	}

	function parseTrackedPath(filePath: string) {
		const parts = filePath.split('/').filter(Boolean);
		if (parts.length >= 2 && knownBuckets.includes(parts[0])) {
			return { bucket: parts[0], objectPath: parts.slice(1).join('/') };
		}
		return { bucket: null, objectPath: filePath };
	}

	function getEntityHref(type: string | null, id: string | null) {
		if (!type) return null;
		if (type === 'profile') return '/admin/profile';
		if (!id) return null;
		if (type === 'article') return `/admin/articles/${id}`;
		if (type === 'project') return `/admin/projects/${id}`;
		if (type === 'resource') return `/admin/resources/${id}`;
		return null;
	}

	async function copyText(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			notify.success('已复制');
		} catch {
			notify.error('复制失败');
		}
	}

	async function handleDeleteFile(fileId: string, fileName: string) {
		const ok = await confirm({
			title: '确定删除此文件记录吗?',
			description: `文件: ${fileName}`,
			confirmText: '删除',
			danger: true
		});

		if (!ok) return;

		const formData = new FormData();
		formData.append('fileId', fileId);

		const response = await fetch('?/deleteFile', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			notify.success('文件已删除');
			invalidateAll();
		} else {
			notify.error('删除失败');
		}
	}

	async function handleCleanupOrphans() {
		const ok = await confirm({
			title: `清理 ${cleanupDays} 天前的孤儿文件?`,
			description: `这将软删除所有超过 ${cleanupDays} 天未被引用的文件记录。`,
			confirmText: '清理',
			danger: true
		});

		if (!ok) return;

		isCleaningUp = true;
		const formData = new FormData();
		formData.append('daysOld', cleanupDays.toString());

		try {
			const response = await fetch('?/cleanupOrphans', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (response.ok && result.type === 'success') {
				notify.success(`已清理 ${result.data.affected || 0} 个孤儿文件`);
				invalidateAll();
			} else {
				notify.error('清理失败');
			}
		} catch {
			notify.error('清理失败');
		} finally {
			isCleaningUp = false;
		}
	}

	const totalPages = $derived(Math.ceil(data.total / data.limit));
	const hasFilters = $derived(
		selectedEntityType || orphanOnly || q.trim() || sort !== 'created_at' || dir !== 'desc'
	);
</script>

<div class="min-h-screen bg-slate-50 p-6 font-sans">
	<div class="max-w-7xl mx-auto space-y-6">
		<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 class="text-2xl font-bold text-slate-900 tracking-tight">文件管理</h1>
				<p class="text-slate-500 mt-1 text-sm">管理系统中的所有媒体资源与文件引用</p>
			</div>
		</div>

		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
			<div
				class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-500/30 transition-colors"
			>
				<div>
					<p class="text-sm font-medium text-slate-500">文件总数</p>
					<p
						class="text-2xl font-bold text-slate-900 mt-1 group-hover:text-blue-600 transition-colors"
					>
						{data.allCount}
					</p>
				</div>
				<div
					class="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"
				>
					<Database size={22} strokeWidth={1.5} />
				</div>
			</div>

			<div
				class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-500/30 transition-colors"
			>
				<div>
					<p class="text-sm font-medium text-slate-500">当前筛选</p>
					<p
						class="text-2xl font-bold text-slate-900 mt-1 group-hover:text-blue-600 transition-colors"
					>
						{data.total}
					</p>
				</div>
				<div
					class="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"
				>
					<ListFilter size={22} strokeWidth={1.5} />
				</div>
			</div>

			<div
				class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-red-500/30 transition-colors"
			>
				<div>
					<p class="text-sm font-medium text-slate-500">孤儿文件</p>
					<p
						class="text-2xl font-bold text-slate-900 mt-1 group-hover:text-red-600 transition-colors"
					>
						{data.orphanCount}
					</p>
				</div>
				<div
					class="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors"
				>
					<AlertTriangle size={22} strokeWidth={1.5} />
				</div>
			</div>

			<div
				class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-500/30 transition-colors"
			>
				<div>
					<p class="text-sm font-medium text-slate-500">当前页码</p>
					<p
						class="text-2xl font-bold text-slate-900 mt-1 group-hover:text-blue-600 transition-colors"
					>
						{data.page} <span class="text-sm text-slate-400 font-normal">/ {totalPages || 1}</span>
					</p>
				</div>
				<div
					class="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"
				>
					<Layers size={22} strokeWidth={1.5} />
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<div
				class="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden"
			>
				<div
					class="px-5 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between"
				>
					<h3 class="font-semibold text-slate-800 flex items-center gap-2 text-sm">
						<Search size={16} class="text-slate-500" />
						筛选与查找
					</h3>
					{#if hasFilters}
						<button
							onclick={clearFilters}
							class="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors bg-blue-50 px-2 py-1 rounded-md"
						>
							重置所有条件
						</button>
					{/if}
				</div>
				<div class="p-5 space-y-4">
					<div class="relative">
						<Search
							class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
							size={18}
						/>
						<input
							type="text"
							bind:value={q}
							placeholder="搜索文件路径、URL 或 Object Key..."
							class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
						/>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<select
							bind:value={selectedEntityType}
							class="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
						>
							<option value="">所有引用实体</option>
							{#each entityTypes as type (type)}
								<option value={type}>{type}</option>
							{/each}
						</select>

						<select
							bind:value={sort}
							class="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
						>
							<option value="created_at">按创建时间</option>
							<option value="last_referenced_at">按最近引用</option>
							<option value="file_size">按文件大小</option>
						</select>

						<div class="flex gap-2">
							<button
								onclick={() => (dir = dir === 'asc' ? 'desc' : 'asc')}
								class="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-sm text-slate-700"
							>
								<ArrowUpDown size={16} class="text-slate-500" />
								{dir === 'asc' ? '升序' : '降序'}
							</button>

							<button
								onclick={applyFilters}
								class="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-sm active:scale-[0.98] font-medium text-sm"
							>
								应用
							</button>
						</div>
					</div>

					<label
						class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors group"
					>
						<input
							type="checkbox"
							bind:checked={orphanOnly}
							class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
						/>
						<span class="text-sm font-medium text-slate-700 group-hover:text-slate-900"
							>仅显示孤儿文件 (未被引用的文件)</span
						>
					</label>
				</div>
			</div>

			<div
				class="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden"
			>
				<div
					class="px-5 py-3 border-b border-slate-200 bg-red-50/50 flex items-center justify-between"
				>
					<h3 class="font-semibold text-red-800 flex items-center gap-2 text-sm">
						<ShieldAlert size={16} class="text-red-500" />
						清理空间
					</h3>
				</div>
				<div class="p-5 flex flex-col justify-between flex-1 gap-4">
					<p class="text-sm text-slate-600 leading-relaxed">
						软删除所有超过指定天数未被引用的<span class="font-medium text-red-600">孤儿文件</span
						>。这些文件可能不再需要。
					</p>

					<div class="space-y-3 pt-2">
						<div class="flex items-center gap-2">
							<span class="text-sm text-slate-500">超过</span>
							<input
								type="number"
								bind:value={cleanupDays}
								min="1"
								max="365"
								class="w-20 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-center outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
							/>
							<span class="text-sm text-slate-500">天</span>
						</div>

						<button
							onclick={handleCleanupOrphans}
							disabled={isCleaningUp}
							class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-sm active:scale-[0.98] font-medium text-sm disabled:opacity-70 disabled:cursor-wait"
						>
							{#if isCleaningUp}
								<span
									class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
								></span>
								清理中...
							{:else}
								<Trash2 size={16} />
								开始清理
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>

		<div
			class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
		>
			{#if data.files.length === 0}
				<div class="p-16 flex flex-col items-center justify-center text-center">
					<div class="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
						<Filter size={32} class="text-slate-300" />
					</div>
					<h3 class="text-lg font-medium text-slate-900">没有找到文件</h3>
					<p class="text-slate-500 mt-1 max-w-sm">
						没有符合当前筛选条件的文件记录。请尝试调整筛选条件或重置。
					</p>
					<button
						onclick={clearFilters}
						class="mt-6 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
					>
						清空筛选
					</button>
				</div>
			{:else}
				<div class="hidden md:block overflow-x-auto">
					<table class="w-full text-sm text-left">
						<thead class="bg-slate-50/80 text-slate-500 border-b border-slate-200">
							<tr>
								<th class="px-6 py-4 font-semibold w-[40%]">文件信息</th>
								<th class="px-6 py-4 font-semibold">类型 / 大小</th>
								<th class="px-6 py-4 font-semibold">引用实体</th>
								<th class="px-6 py-4 font-semibold">时间信息</th>
								<th class="px-6 py-4 font-semibold text-right">操作</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100">
							{#each data.files as file (file.id)}
								{@const parsed = parseTrackedPath(file.file_path)}
								{@const entityHref = getEntityHref(
									file.used_in_entity_type,
									file.used_in_entity_id
								)}
								{@const publicUrl = getPublicUrl(file.file_path)}
								<tr
									class="group hover:bg-slate-50/80 transition-colors {file.is_orphan
										? 'bg-red-50/20'
										: ''}"
								>
									<td class="px-6 py-4">
										<div class="flex items-start gap-4">
											{#if file.mime_type?.startsWith('image/') && publicUrl}
												<div
													class="relative shrink-0 w-12 h-12 rounded-lg border border-slate-200 bg-white overflow-hidden group-hover:border-slate-300 transition-colors"
												>
													<img
														src={publicUrl}
														alt=""
														class="w-full h-full object-cover"
														loading="lazy"
													/>
												</div>
											{:else}
												{@const Icon = getFileIcon(file.mime_type)}
												<div
													class="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center border transition-colors {file.is_orphan
														? 'border-red-200 bg-red-50 text-red-500'
														: 'border-slate-200 bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-slate-600'}"
												>
													<Icon size={20} strokeWidth={1.5} />
												</div>
											{/if}
											<div class="min-w-0 flex-1 pt-0.5">
												<div class="flex items-center gap-2 mb-0.5">
													<p
														class="font-medium text-slate-900 truncate max-w-[200px] lg:max-w-[280px]"
														title={parsed.objectPath}
													>
														{parsed.objectPath}
													</p>
													{#if file.is_orphan}
														<span
															class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700"
														>
															孤儿
														</span>
													{/if}
												</div>
												{#if parsed.bucket}
													<p class="text-xs text-slate-500 flex items-center gap-1">
														<Database size={10} />
														{parsed.bucket}
													</p>
												{/if}
											</div>
										</div>
									</td>
									<td class="px-6 py-4 align-top pt-5">
										<div class="flex flex-col gap-1">
											<span class="font-medium text-slate-700"
												>{formatFileSize(file.file_size)}</span
											>
											<span class="text-xs text-slate-400 font-mono"
												>{file.mime_type || 'unknown'}</span
											>
										</div>
									</td>
									<td class="px-6 py-4 align-top pt-5">
										{#if file.used_in_entity_type && file.used_in_entity_id}
											<div class="flex flex-col gap-1">
												<span
													class="inline-flex items-center gap-1.5 text-slate-700 font-medium capitalize"
												>
													<Layers size={14} class="text-slate-400" />
													{file.used_in_entity_type}
												</span>
												<span class="text-xs text-slate-400 font-mono flex items-center gap-2">
													ID: {file.used_in_entity_id.slice(0, 8)}...
													{#if entityHref}
														<a
															href={resolve(entityHref)}
															class="text-blue-600 hover:underline hover:text-blue-700 font-medium"
														>
															查看
														</a>
													{/if}
												</span>
											</div>
										{:else}
											<span class="text-slate-400 text-sm">—</span>
										{/if}
									</td>
									<td class="px-6 py-4 align-top pt-5">
										<div class="flex flex-col gap-1 text-xs">
											<div class="text-slate-600">
												<span class="text-slate-400 w-8 inline-block">创建</span>
												{formatDate(file.created_at)}
											</div>
											{#if file.last_referenced_at}
												<div class="text-slate-600">
													<span class="text-slate-400 w-8 inline-block">引用</span>
													{formatDate(file.last_referenced_at)}
												</div>
											{/if}
										</div>
									</td>
									<td class="px-6 py-4 align-top pt-4">
										<div
											class="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity duration-200"
										>
											{#if publicUrl}
												<button
													type="button"
													onclick={() => window.open(publicUrl, '_blank', 'noopener,noreferrer')}
													class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
													title="打开文件"
												>
													<ExternalLink size={18} />
												</button>
												<button
													onclick={() => copyText(publicUrl)}
													class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
													title="复制 URL"
												>
													<Copy size={18} />
												</button>
											{/if}
											<button
												onclick={() => handleDeleteFile(file.id, file.file_path)}
												class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
												title="删除记录"
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

				<div class="md:hidden divide-y divide-slate-100">
					{#each data.files as file (file.id)}
						{@const parsed = parseTrackedPath(file.file_path)}
						{@const entityHref = getEntityHref(file.used_in_entity_type, file.used_in_entity_id)}
						{@const publicUrl = getPublicUrl(file.file_path)}
						<div class="p-4 {file.is_orphan ? 'bg-red-50/30' : ''}">
							<div class="flex items-start gap-4">
								{#if file.mime_type?.startsWith('image/') && publicUrl}
									<img
										src={publicUrl}
										alt=""
										class="shrink-0 w-16 h-16 rounded-lg object-cover border border-slate-200 bg-white"
										loading="lazy"
									/>
								{:else}
									{@const Icon = getFileIcon(file.mime_type)}
									<div
										class="shrink-0 w-16 h-16 rounded-lg flex items-center justify-center border {file.is_orphan
											? 'border-red-200 bg-red-100 text-red-600'
											: 'border-slate-200 bg-slate-50 text-slate-600'}"
									>
										<Icon size={24} />
									</div>
								{/if}

								<div class="min-w-0 flex-1 space-y-2">
									<div>
										<div class="flex items-center gap-2">
											<p class="font-medium text-slate-900 truncate text-sm">{parsed.objectPath}</p>
											{#if file.is_orphan}
												<span
													class="text-[10px] rounded bg-red-100 px-1.5 py-0.5 text-red-700 font-medium"
													>孤儿</span
												>
											{/if}
										</div>
										<p class="text-xs text-slate-500 mt-0.5">
											{formatFileSize(file.file_size)} · {file.mime_type || 'unknown'}
										</p>
									</div>

									{#if file.used_in_entity_type}
										<div
											class="flex items-center gap-2 text-xs bg-slate-50 p-2 rounded border border-slate-100"
										>
											<Layers size={12} class="text-slate-400" />
											<span class="text-slate-700 font-medium">{file.used_in_entity_type}</span>
											{#if entityHref}
												<a href={resolve(entityHref)} class="ml-auto text-blue-600 font-medium"
													>查看</a
												>
											{/if}
										</div>
									{/if}

									<div class="flex items-center justify-between pt-1">
										<span class="text-xs text-slate-400">{formatDate(file.created_at)}</span>
										<div class="flex items-center gap-1">
											{#if publicUrl}
												<button
													onclick={() => copyText(publicUrl)}
													class="p-1.5 text-slate-500 hover:bg-slate-100 rounded"
												>
													<Copy size={16} />
												</button>
												<button
													onclick={() => window.open(publicUrl, '_blank', 'noopener,noreferrer')}
													class="p-1.5 text-slate-500 hover:bg-slate-100 rounded"
												>
													<ExternalLink size={16} />
												</button>
											{/if}
											<button
												onclick={() => handleDeleteFile(file.id, file.file_path)}
												class="p-1.5 text-red-500 hover:bg-red-50 rounded"
											>
												<Trash2 size={16} />
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- 分页 -->
		{#if totalPages > 1}
			<div class="flex flex-col items-center justify-center gap-4 py-4">
				<div class="flex items-center gap-2">
					<button
						onclick={() => goToPage(data.page - 1)}
						disabled={data.page === 1}
						class="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600 hover:text-slate-900"
					>
						<ChevronLeft size={20} />
					</button>

					<div class="flex items-center gap-1.5">
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
								class="w-10 h-10 rounded-lg border transition-all font-medium {pageNum === data.page
									? 'bg-slate-900 text-white border-slate-900 shadow-sm'
									: 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'}"
							>
								{pageNum}
							</button>
						{/each}
					</div>

					<button
						onclick={() => goToPage(data.page + 1)}
						disabled={data.page === totalPages}
						class="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600 hover:text-slate-900"
					>
						<ChevronRight size={20} />
					</button>
				</div>
				<p class="text-xs text-slate-400">
					显示第 {data.page} 页，共 {totalPages} 页
				</p>
			</div>
		{/if}
	</div>
</div>
