<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { TrendingUp, Users, FileText, Eye } from 'lucide-svelte';
	import type { PageData } from './$types';

	import { notify } from '$lib/feedback/notify';

	// ... previous imports

	let { data }: { data: PageData } = $props();

	let stats = $derived([
		{
			label: '文章总数',
			value: data.stats.articlesTotal.toString(),
			change: '实时',
			icon: FileText,
			color: 'text-brand',
			bg: 'bg-brand/10'
		},
		{
			label: '已发布文章',
			value: data.stats.articlesPublished.toString(),
			change: '实时',
			icon: Eye,
			color: 'text-blue-500',
			bg: 'bg-blue-50'
		},
		{
			label: '项目总数',
			value: data.stats.projectsTotal.toString(),
			change: '实时',
			icon: TrendingUp,
			color: 'text-amber-500',
			bg: 'bg-amber-50'
		},
		{
			label: '资源总数',
			value: data.stats.resourcesTotal.toString(),
			change: '实时',
			icon: Users,
			color: 'text-emerald-500',
			bg: 'bg-emerald-50'
		}
	]);

	let recentArticles = $derived(data.recentArticles);

	// Cleanup Logic
	let isCleaning = $state(false);
	let showConfirmModal = $state(false);
	let scanResult = $state<{
		totalFiles: number;
		usedFiles: number;
		orphanCount: number;
		orphans: string[];
	} | null>(null);

	async function handleScan() {
		isCleaning = true;
		scanResult = null;
		try {
			const res = await fetch('/api/admin/cleanup', {
				method: 'POST'
			});
			if (res.ok) {
				const data = await res.json();
				scanResult = data;
			} else {
				notify.error('扫描失败，请检查网络或权限');
			}
		} catch (e) {
			console.error(e);
			notify.error('扫描发生异常');
		} finally {
			isCleaning = false;
		}
	}

	function confirmDelete() {
		if (!scanResult || scanResult.orphanCount === 0) return;
		showConfirmModal = true;
	}

	async function performDelete() {
		if (!scanResult || scanResult.orphanCount === 0) return;

		isCleaning = true;
		showConfirmModal = false; // 关闭弹窗

		try {
			const res = await fetch('/api/admin/cleanup', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ files: scanResult.orphans })
			});

			if (res.ok) {
				const data = await res.json();
				notify.success(`清理成功！已删除 ${data.deleted?.length || 0} 个文件。`);
				scanResult = null;
			} else {
				const err = await res.json();
				notify.error(`清理失败: ${err.error || '未知错误'}`);
			}
		} catch (e) {
			console.error(e);
			notify.error('清理请求异常');
		} finally {
			isCleaning = false;
		}
	}
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-slate-900">控制台概览</h1>
			<p class="text-slate-500 mt-1 text-sm">欢迎回来，Admin。这是今天的站点数据。</p>
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
					全局数据
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
					我的数据
				</button>
			</div>
		{/if}
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		{#each stats as stat (stat.label)}
			<div
				class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300"
			>
				<div class="flex justify-between items-start mb-3">
					<div class="p-2.5 rounded-lg {stat.bg} {stat.color}">
						<stat.icon size={20} />
					</div>
					<span
						class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100"
					>
						{stat.change}
					</span>
				</div>
				<h3 class="text-2xl font-bold text-slate-900">{stat.value}</h3>
				<p class="text-xs text-slate-500 font-medium mt-1">{stat.label}</p>
			</div>
		{/each}
	</div>

	<!-- Content Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Recent Articles -->
		<div
			class="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
		>
			<div class="p-5 border-b border-slate-100 flex justify-between items-center">
				<h2 class="text-base font-bold text-slate-900">最近文章</h2>
				<a href={resolve('/admin/articles')} class="text-xs font-medium text-brand hover:underline"
					>查看全部</a
				>
			</div>
			<div class="divide-y divide-slate-100">
				{#each recentArticles as article (article.title)}
					<div
						class="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group"
					>
						<div class="min-w-0 pr-4">
							<h4
								class="font-bold text-sm text-slate-900 mb-1 truncate group-hover:text-brand transition-colors"
							>
								{article.title}
							</h4>
							<div class="flex items-center space-x-3 text-xs text-slate-500">
								<span>{article.date}</span>
								<span>•</span>
								<span>{article.comments} 条评论</span>
							</div>
						</div>
						<span
							class="px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 border"
							class:bg-emerald-50={article.status === '已发布'}
							class:text-emerald-700={article.status === '已发布'}
							class:border-emerald-100={article.status === '已发布'}
							class:bg-slate-100={article.status === '草稿'}
							class:text-slate-600={article.status === '草稿'}
							class:border-slate-200={article.status === '草稿'}
						>
							{article.status}
						</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- System Status -->
		<div class="space-y-6">
			<div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
				<h2 class="text-base font-bold text-slate-900 mb-5">系统状态</h2>
				<div class="space-y-5">
					<div
						class="p-3 bg-emerald-50 rounded-lg border border-emerald-100 flex items-start space-x-3"
					>
						<div
							class="w-2 h-2 mt-1.5 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse"
						></div>
						<div>
							<p class="text-xs font-bold text-emerald-900">系统运行正常</p>
							<p class="text-[10px] text-emerald-700 mt-1 leading-relaxed">
								Supabase 数据库状态健康。所有服务在线。
							</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Cleanup Widget (Admins Only) -->
			{#if data.isGlobalViewAllowed}
				<div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
					<h2 class="text-base font-bold text-slate-900 mb-5">文件维护</h2>
					<div class="space-y-4">
						<div class="flex justify-between items-center text-xs font-medium">
							<span class="text-slate-600">孤儿文件清理</span>
							{#if isCleaning}
								<span class="text-brand animate-pulse">正在处理...</span>
							{:else if scanResult}
								<span class="text-emerald-600">就绪</span>
							{:else}
								<span class="text-slate-400">空闲</span>
							{/if}
						</div>

						{#if scanResult}
							<div
								class="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-1"
							>
								<div class="flex justify-between">
									<span>总文件数:</span>
									<span class="font-bold">{scanResult.totalFiles}</span>
								</div>
								<div class="flex justify-between">
									<span>正在使用:</span>
									<span class="font-bold text-emerald-600">{scanResult.usedFiles}</span>
								</div>
								<div class="flex justify-between">
									<span>孤儿文件:</span>
									<span class="font-bold text-red-500">{scanResult.orphanCount}</span>
								</div>
							</div>
							<div class="flex space-x-2">
								<button
									onclick={confirmDelete}
									disabled={scanResult.orphanCount === 0}
									class="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{scanResult.orphanCount > 0 ? '确认删除' : '无文件可删'}
								</button>
								<button
									onclick={() => (scanResult = null)}
									class="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
								>
									取消
								</button>
							</div>
						{:else}
							<p class="text-[10px] text-slate-500 leading-relaxed">
								扫描存储桶中未被任何文章、项目或头像引用的“孤儿文件”并清理以释放空间。
							</p>
							<button
								onclick={handleScan}
								disabled={isCleaning}
								class="w-full px-3 py-2 bg-brand/10 text-brand rounded-lg text-xs font-bold hover:bg-brand/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
							>
								{#if isCleaning}
									<div
										class="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"
									></div>
								{/if}
								扫描孤儿文件
							</button>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

{#if showConfirmModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<!-- Backdrop -->
		<button
			type="button"
			class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-default"
			aria-label="Close modal"
			onclick={() => (showConfirmModal = false)}
		></button>

		<!-- Modal Content -->
		<div
			class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200"
		>
			<div class="p-6 text-center space-y-4">
				<div class="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 text-red-500"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
				</div>
				<div>
					<h3 class="text-lg font-bold text-slate-900">确认删除？</h3>
					<p class="text-sm text-slate-500 mt-2">
						即将永久删除 <span class="font-bold text-red-500">{scanResult?.orphanCount}</span>
						个孤儿文件。
						<br />此操作无法撤销。
					</p>
				</div>
			</div>
			<div class="px-6 pb-6 flex gap-3">
				<button
					onclick={() => (showConfirmModal = false)}
					class="flex-1 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
				>
					取消
				</button>
				<button
					onclick={performDelete}
					class="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-sm transition-colors"
				>
					确认删除
				</button>
			</div>
		</div>
	</div>
{/if}
