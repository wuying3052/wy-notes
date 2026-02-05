<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { Calendar, ChevronLeft, PanelRightOpen } from 'lucide-svelte';
	import type { PageData } from './$types';
	import TableOfContents from '$lib/components/articles/TableOfContents.svelte';
	import { SITE_CONFIG } from '$lib/config/site';

	// 导入样式
	import '@styles/code.css';
	import '@styles/post.css';

	let { data }: { data: PageData } = $props();
	let { content: Content, meta } = $derived(data);

	// 构建完整的文章 URL 和 OG 图片 URL
	let articleUrl = $derived(`${SITE_CONFIG.url}${page.url.pathname}`);
	let ogImage = $derived(
		meta.cover?.startsWith('http')
			? meta.cover
			: `${SITE_CONFIG.url}${meta.cover || '/og-image.png'}`
	);

	let articleElement = $state<HTMLElement | null>(null);
	let tocItems = $state<{ id: string; text: string; depth: number }[]>([]);
	let isTocCollapsed = $state(false);

	// 提取目录
	$effect(() => {
		if (articleElement) {
			const headings = articleElement.querySelectorAll('h2, h3');
			tocItems = Array.from(headings).map((h) => ({
				id: h.id,
				text: (h as HTMLElement).innerText,
				depth: parseInt(h.tagName[1])
			}));
		}
	});

	// 复制按钮功能
	onMount(() => {
		const copyButtons = document.querySelectorAll('.copy-btn');

		copyButtons.forEach((btn) => {
			btn.addEventListener('click', async () => {
				const codeTitle = btn.closest('.rehype-code-title');
				const preBlock = codeTitle?.nextElementSibling;
				const code = preBlock?.querySelector('code')?.textContent || '';

				try {
					await navigator.clipboard.writeText(code);
					btn.textContent = 'Copied!';
					btn.classList.add('copied');

					setTimeout(() => {
						btn.textContent = 'Copy';
						btn.classList.remove('copied');
					}, 2000);
				} catch (err) {
					console.error('Failed to copy:', err);
				}
			});
		});
	});
</script>

<svelte:head>
	<title>{meta.title} | WY NOTES</title>
	<meta name="description" content={meta.description || meta.title} />

	<!-- Open Graph / 社交分享 -->
	<meta property="og:type" content="article" />
	<meta property="og:url" content={articleUrl} />
	<meta property="og:title" content={meta.title} />
	<meta property="og:description" content={meta.description || meta.title} />
	<meta property="og:image" content={ogImage} />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content={articleUrl} />
	<meta property="twitter:title" content={meta.title} />
	<meta property="twitter:description" content={meta.description || meta.title} />
	<meta property="twitter:image" content={ogImage} />
</svelte:head>

<div class="min-h-screen pb-20 bg-[#f8fafc]">
	<!-- 封面区域 -->
	<div class="relative h-[55vh] w-full overflow-hidden">
		<!-- 微信分享预览图兜底 (放在页面最前面提高抓取权重) -->
		<div style="display:none;">
			<img src={ogImage} alt="Preview" />
		</div>

		<div class="absolute inset-0 bg-slate-900/40 z-10 backdrop-blur-[2px]"></div>
		{#if meta.cover}
			<img
				src={meta.cover}
				alt={meta.title}
				class="absolute inset-0 w-full h-full object-cover scale-105 transition-transform duration-700"
			/>
		{:else}
			<div class="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900"></div>
		{/if}

		<div
			class="absolute inset-0 z-20 flex flex-col justify-end pb-16 px-4 md:px-8 max-w-screen-2xl mx-auto"
		>
			<a
				href={resolve('/articles')}
				class="group inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors"
			>
				<ChevronLeft size={20} class="group-hover:-translate-x-1 transition-transform" />
				<span class="ml-1">返回文章列表</span>
			</a>

			<div class="flex items-center gap-3 mb-4">
				{#if meta.tags}
					{#each meta.tags as tag}
						<span
							class="px-3 py-1 rounded-full bg-brand text-white text-xs font-bold uppercase tracking-widest"
						>
							{tag}
						</span>
					{/each}
				{/if}
			</div>

			<h1 class="text-4xl md:text-6xl font-bold text-white mb-8 leading-[1.1] drop-shadow-lg">
				{meta.title}
			</h1>

			<div class="flex flex-wrap items-center gap-6 text-white/90 text-sm">
				<span class="flex items-center gap-1.5"><Calendar size={16} />{meta.date}</span>
			</div>
		</div>
	</div>

	<!-- 内容区域 -->
	<div class="relative w-full z-30 -mt-12 pointer-events-none">
		<div
			class="mx-auto px-4 md:px-8 pointer-events-auto transition-all duration-300
			{isTocCollapsed ? 'max-w-[1200px]' : 'max-w-screen-2xl'}"
		>
			<div class="flex flex-col lg:flex-row gap-8 items-start relative">
				<!-- 文章正文 -->
				<div
					class="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-6 md:p-16 border border-slate-100 transition-all duration-300
					{isTocCollapsed ? 'w-full' : 'w-full xl:w-[calc(100%-320px)]'}"
				>
					<article bind:this={articleElement} class="prose max-w-none">
						<Content />
					</article>
				</div>
			</div>
		</div>

		<!-- 侧边栏/目录 -->
		<aside
			class="hidden xl:block absolute top-0 right-0 h-full pointer-events-none transition-all duration-300
			{isTocCollapsed ? 'w-16' : 'w-72'}"
		>
			<div class="sticky top-32 self-start pointer-events-auto pr-8">
				{#if isTocCollapsed}
					<!-- 收起状态：仅显示展开按钮 -->
					<button
						onclick={() => (isTocCollapsed = false)}
						class="w-12 h-12 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl border border-slate-100 shadow-sm text-slate-400 hover:text-slate-600 hover:bg-white transition-colors"
						aria-label="展开目录"
					>
						<PanelRightOpen size={20} />
					</button>
				{:else}
					<!-- 展开状态：显示完整目录 -->
					<div
						class="max-h-[calc(100vh-160px)] overflow-y-auto hide-scrollbar bg-white/40 backdrop-blur-sm rounded-[2rem] p-8 border border-slate-100 shadow-sm"
					>
						<TableOfContents items={tocItems} onCollapse={() => (isTocCollapsed = true)} />
					</div>
				{/if}
			</div>
		</aside>
	</div>
</div>

<style>
	.hide-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.hide-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
