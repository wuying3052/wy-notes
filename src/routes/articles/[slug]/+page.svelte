<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		Calendar,
		Clock,
		ChevronLeft,
		MessageSquare,
		Copy,
		Check,
		ListTree,
		X,
		User
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import { notify } from '$lib/feedback/notify';
	import { onMount } from 'svelte';

	// Svelte 5 Props 接收
	let { data }: { data: PageData } = $props();

	// 状态派生与响应式变量
	let article = $derived(data.article);
	let commentValue = $state('');
	let activeId = $state(''); // 当前滚动到的目录 ID

	// 阅读进度条
	let scrollProgress = $state(0);

	// 移动端目录控制
	let showMobileToc = $state(false);

	// 处理评论提交
	function handleCommentSubmit(e: Event) {
		e.preventDefault();
		notify.info('评论功能开发中...');
		commentValue = '';
	}

	/**
	 * 代码块客户端激活逻辑 (Hydration)
	 * 为服务端生成的代码块添加交互功能 (复制)
	 */
	function hydrateCodeBlocks() {
		// 查找所有由服务端生成的复制按钮
		const copyBtns = document.querySelectorAll('.code-block-wrapper .copy-btn');

		copyBtns.forEach((btn) => {
			const button = btn as HTMLButtonElement;
			// 注入图标 HTML (服务端只输出了文本以保持简单的 HTML 结构，客户端增强)
			button.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span>复制</span>`;

			button.onclick = async () => {
				// 查找同级 wrapper 下的 pre code
				const wrapper = button.closest('.code-block-wrapper');
				const code = wrapper?.querySelector('pre code') as HTMLElement;
				const text = code?.innerText || '';

				try {
					await navigator.clipboard.writeText(text);
					button.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-emerald-400"><path d="M20 6 9 17l-5-5"/></svg><span class="text-emerald-400">已复制</span>`;
					setTimeout(() => {
						button.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span>复制</span>`;
					}, 2000);
				} catch (err) {
					console.error('Failed to copy', err);
					notify.error('复制失败');
				}
			};
		});
	}

	/**
	 * 目录滚动追踪逻辑
	 */
	function initTOCObserver() {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						activeId = entry.target.id;
					}
				});
			},
			{ rootMargin: '-10% 0% -80% 0%' }
		);

		document.querySelectorAll('article h2, article h3').forEach((h) => observer.observe(h));
		return observer;
	}

	onMount(() => {
		hydrateCodeBlocks();
		const tocObserver = initTOCObserver();

		// 阅读进度追踪
		const updateProgress = () => {
			const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
			scrollProgress = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
		};
		window.addEventListener('scroll', updateProgress, { passive: true });
		updateProgress(); // 初始化

		return () => {
			tocObserver.disconnect();
			window.removeEventListener('scroll', updateProgress);
		};
	});
</script>

<svelte:head>
	<title>{article.title} | WY NOTES</title>
	<meta name="description" content={article.excerpt || article.title} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={article.title} />
	<meta property="og:description" content={article.excerpt || article.title} />
	<meta property="og:image" content={article.cover} />
	<meta property="twitter:card" content="summary_large_image" />
</svelte:head>

<!-- 阅读进度条 -->
<div
	class="fixed top-0 left-0 h-1 bg-gradient-to-r from-brand to-blue-500 z-50 transition-all duration-150"
	style="width: {scrollProgress}%"
></div>

<!-- 移动端目录按钮 -->
{#if article.toc?.length}
	<button
		onclick={() => (showMobileToc = true)}
		class="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-white rounded-2xl shadow-xl shadow-slate-200 flex items-center justify-center border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all group"
		aria-label="打开目录"
	>
		<ListTree size={22} class="text-slate-600 group-hover:text-brand transition-colors" />
	</button>
{/if}

<!-- 移动端目录遮罩层 -->
{#if showMobileToc}
	<div
		class="lg:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
		onclick={() => (showMobileToc = false)}
		onkeydown={(e) => e.key === 'Escape' && (showMobileToc = false)}
		role="button"
		tabindex="0"
	>
		<div
			class="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl p-6 overflow-y-auto"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			tabindex="0"
		>
			<div class="flex items-center justify-between mb-6">
				<div class="flex items-center gap-2 text-slate-400">
					<ListTree size={18} />
					<span class="text-xs font-bold uppercase tracking-widest">文章目录</span>
				</div>
				<button
					onclick={() => (showMobileToc = false)}
					class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
				>
					<X size={20} class="text-slate-500" />
				</button>
			</div>
			<nav class="relative">
				<div class="absolute left-0 top-0 bottom-0 w-[2px] bg-slate-100"></div>
				<ul class="space-y-1">
					{#each article.toc as item (item.id)}
						<li style="padding-left: {(item.level - 2) * 12}px">
							<a
								href="#{item.id}"
								onclick={() => (showMobileToc = false)}
								class="block py-2 pl-4 -ml-[2px] text-[13px] font-medium transition-all border-l-2
								{activeId === item.id
									? 'text-brand border-brand bg-brand/5 rounded-r-lg'
									: 'text-slate-500 border-transparent hover:text-slate-800 hover:border-slate-300'}"
							>
								{item.text}
							</a>
						</li>
					{/each}
				</ul>
			</nav>
		</div>
	</div>
{/if}

<div class="min-h-screen pb-20 bg-[#f8fafc]">
	<div class="relative h-[55vh] w-full overflow-hidden">
		<div class="absolute inset-0 bg-slate-900/40 z-10 backdrop-blur-[2px]"></div>
		<img
			src={article.cover}
			alt={article.title}
			class="absolute inset-0 w-full h-full object-cover scale-105 transition-transform duration-700"
		/>
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
				<span
					class="px-3 py-1 rounded-full bg-brand text-white text-xs font-bold uppercase tracking-widest"
				>
					{article.category}
				</span>
			</div>
			<h1
				class="text-4xl md:text-6xl font-bold text-white mb-8 leading-[1.1] max-w-4xl drop-shadow-lg"
			>
				{article.title}
			</h1>
			<div class="flex flex-wrap items-center gap-6 text-white/90 text-sm">
				<div class="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
					{#if article.author.avatar}
						<img
							src={article.author.avatar}
							alt={article.author.name}
							class="w-6 h-6 rounded-full"
						/>
					{:else}
						<div
							class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white/70"
						>
							<User size={12} />
						</div>
					{/if}
					<span class="font-medium">{article.author.name}</span>
				</div>
				<span class="flex items-center gap-1.5"><Calendar size={16} />{article.date}</span>
				<span class="flex items-center gap-1.5"><Clock size={16} />预计阅读 {article.readTime}</span
				>
			</div>
		</div>
	</div>

	<div
		class="max-w-screen-2xl mx-auto px-4 md:px-8 -mt-12 relative z-30 grid grid-cols-1 lg:grid-cols-12 gap-8"
	>
		<div class="lg:col-span-9 space-y-8">
			<div
				class="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-8 md:p-16 border border-slate-100"
			>
				<article
					class="prose prose-lg prose-slate max-w-none
                    prose-headings:scroll-mt-24 prose-headings:text-slate-900 prose-headings:font-bold
                    prose-h1:text-3xl prose-h1:mb-6 prose-h1:leading-tight lg:prose-h1:text-4xl
                    prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-slate-100 prose-h2:pb-2 lg:prose-h2:text-2xl
                    prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 lg:prose-h3:text-xl
                    prose-p:text-slate-600 prose-p:leading-7 prose-p:mb-4
                    prose-a:text-brand prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
                    prose-headings:prose-a:text-slate-900 prose-headings:prose-a:no-underline prose-headings:prose-a:cursor-default hover:prose-headings:prose-a:text-slate-900 hover:prose-headings:prose-a:no-underline
                    prose-blockquote:border-l-4 prose-blockquote:border-brand prose-blockquote:bg-slate-50 prose-blockquote:px-5 prose-blockquote:py-3 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-slate-700 prose-blockquote:my-6
                    prose-img:rounded-2xl prose-img:shadow-lg prose-img:my-6
                    prose-strong:text-slate-900 prose-strong:font-bold
                    prose-hr:my-8 prose-hr:border-t prose-hr:border-slate-300 prose-hr:w-full prose-hr:rounded-full
                    prose-ul:list-disc prose-ul:pl-6 prose-ul:marker:text-slate-300 prose-ul:my-4
                    prose-ol:list-decimal prose-ol:pl-6 prose-ol:marker:text-slate-400 prose-ol:my-4
                    prose-li:my-1.5 prose-li:text-slate-600
                    prose-code:text-brand prose-code:bg-brand/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-code:font-medium
                    prose-pre:bg-transparent prose-pre:p-0"
				>
					{@html article.contentHtml}
				</article>
			</div>
		</div>

		<div class="hidden lg:block lg:col-span-3">
			<div
				class="sticky top-28 bg-white/50 backdrop-blur-xl rounded-[2rem] p-8 border border-white shadow-sm"
			>
				<div class="flex items-center gap-2 mb-8 text-slate-400">
					<ListTree size={18} />
					<span class="text-xs font-bold uppercase tracking-widest">文章目录</span>
				</div>

				{#if article.toc?.length}
					<nav class="relative">
						<div class="absolute left-0 top-0 bottom-0 w-[2px] bg-slate-100"></div>

						<ul class="space-y-1">
							{#each article.toc as item (item.id)}
								<li style="padding-left: {(item.level - 2) * 12}px">
									<a
										href="#{item.id}"
										class="block py-2 pl-4 -ml-[2px] text-[13px] font-medium transition-all border-l-2
                                            {activeId === item.id
											? 'text-brand border-brand bg-brand/5 rounded-r-lg'
											: 'text-slate-500 border-transparent hover:text-slate-800 hover:border-slate-300'}"
									>
										{item.text}
									</a>
								</li>
							{/each}
						</ul>
					</nav>
				{:else}
					<p class="text-xs text-slate-400 italic">暂无章节导航</p>
				{/if}
			</div>
		</div>

		<!-- 评论区：现在作为 grid 的最后一个子项，设置为 col-span-12 即可实现拉宽 -->
		<div
			class="lg:col-span-12 bg-white rounded-[2.5rem] shadow-lg p-8 md:p-12 border border-slate-100"
		>
			<div class="flex items-center gap-3 mb-10">
				<div class="p-3 bg-brand/10 text-brand rounded-2xl"><MessageSquare size={24} /></div>
				<h3 class="text-2xl font-bold text-slate-900">社区讨论</h3>
			</div>

			{#if data.currentUser}
				<form onsubmit={handleCommentSubmit} class="mb-12 group">
					<div class="flex gap-4">
						<div
							class="w-12 h-12 rounded-2xl bg-white flex-shrink-0 border-2 border-white shadow-sm overflow-hidden"
						>
							{#if data.currentUser?.avatar_url}
								<img
									src={data.currentUser.avatar_url}
									alt="me"
									class="w-full h-full object-cover"
								/>
							{:else}
								<div
									class="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400"
								>
									<User size={24} />
								</div>
							{/if}
						</div>
						<div class="flex-grow space-y-4">
							<textarea
								bind:value={commentValue}
								placeholder="输入你的见解..."
								rows="3"
								class="w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all resize-none text-slate-700"
							></textarea>
							<div class="flex justify-end">
								<button
									type="submit"
									disabled={!commentValue.trim()}
									class="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-brand transition-all hover:-translate-y-0.5 disabled:opacity-30 disabled:translate-y-0"
								>
									发布评论
								</button>
							</div>
						</div>
					</div>
				</form>
			{:else}
				<div
					class="mb-12 p-8 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-3"
				>
					<div
						class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto text-slate-300 shadow-sm"
					>
						<User size={24} />
					</div>
					<h4 class="font-bold text-slate-900">参与讨论</h4>
					<p class="text-sm text-slate-500">
						请 <a href={resolve('/login')} class="text-brand font-bold hover:underline"> 登录 </a> 后发表评论
					</p>
				</div>
			{/if}

			<div class="space-y-10">
				{#if data.comments && data.comments.length > 0}
					{#each data.comments as comment (comment.id)}
						<div class="flex gap-4 group">
							<div
								class="w-12 h-12 rounded-2xl bg-slate-100 flex-shrink-0 border-2 border-white shadow-sm overflow-hidden"
							>
								{#if comment.avatar}
									<img
										src={comment.avatar}
										alt={comment.author}
										class="w-full h-full object-cover"
									/>
								{:else}
									<div
										class="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400"
									>
										<User size={24} />
									</div>
								{/if}
							</div>
							<div class="flex-grow pb-8 border-b border-slate-50 last:border-0">
								<div class="flex items-center justify-between mb-2">
									<span class="font-bold text-slate-900">{comment.author}</span>
									<span class="text-xs text-slate-400">{comment.date}</span>
								</div>
								<p class="text-slate-600 text-[15px] leading-relaxed">
									{comment.content}
								</p>
							</div>
						</div>
					{/each}
				{:else}
					<div class="py-12 text-center">
						<div
							class="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-300"
						>
							<MessageSquare size={32} />
						</div>
						<p class="text-slate-400 text-sm">暂无评论，快来抢沙发吧~</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	/* 玻璃拟态全局变量 */
	:global(.glass) {
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	/* ===== 代码块基础样式 ===== */
	:global(.prose pre) {
		white-space: pre !important;
		overflow-x: auto !important;
		background-color: transparent !important;
		border: none !important;
		max-width: 100%;
		position: relative;
	}

	:global(.prose pre code) {
		display: block !important;
		width: max-content !important;
		min-width: 100% !important;
		white-space: pre !important;
		font-family: 'Fira Code', 'JetBrains Mono', monospace !important;
		font-size: 0.9rem !important;
		background: transparent !important;
		padding: 0 !important;
		counter-reset: line;
	}

	/* ===== 代码行号样式 ===== */
	:global(.prose pre[data-line-numbers] code .line) {
		display: inline-block;
		width: 100%;
		padding-left: 3.5rem;
		position: relative;
		min-height: 1.5rem; /* Ensure empty lines have height */
		line-height: 1.5rem; /* Consistent line height */
	}

	:global(.prose pre[data-line-numbers] code .line::before) {
		content: attr(data-line);
		position: absolute;
		left: 0;
		width: 2.5rem;
		padding-right: 0.75rem;
		text-align: right;
		color: #9ca3af;
		font-size: 0.8rem;
		user-select: none;
		opacity: 0.6;
		border-right: 1px solid #e5e7eb;
		margin-right: 1rem;
	}

	/* ===== 行高亮样式 (// [!code highlight]) ===== */
	:global(.prose pre code .line.highlighted) {
		background-color: rgba(59, 130, 246, 0.1);
		border-left: 3px solid #3b82f6;
		margin-left: -3px;
	}

	/* ===== Diff 样式 (// [!code ++] / // [!code --]) ===== */
	:global(.prose pre code .line.diff.add) {
		background-color: rgba(34, 197, 94, 0.15);
		border-left: 3px solid #22c55e;
		margin-left: -3px;
	}

	:global(.prose pre code .line.diff.add::after) {
		content: '+';
		position: absolute;
		left: 3rem;
		color: #22c55e;
		font-weight: bold;
	}

	:global(.prose pre code .line.diff.remove) {
		background-color: rgba(239, 68, 68, 0.15);
		border-left: 3px solid #ef4444;
		margin-left: -3px;
	}

	:global(.prose pre code .line.diff.remove::after) {
		content: '-';
		position: absolute;
		left: 3rem;
		color: #ef4444;
		font-weight: bold;
	}

	/* ===== 单词高亮样式 (// [!code word:xxx]) ===== */
	:global(.prose pre code .highlighted-word) {
		background-color: rgba(251, 191, 36, 0.3);
		padding: 0.1rem 0.2rem;
		border-radius: 3px;
		border-bottom: 2px solid #f59e0b;
	}

	/* ===== Shiki 主题过渡 ===== */
	:global(.shiki) {
		transition: all 0.3s ease;
	}

	/* ===== 代码块滚动条美化（浅色主题） ===== */
	:global(.code-block-wrapper pre::-webkit-scrollbar) {
		height: 6px;
	}

	:global(.code-block-wrapper pre::-webkit-scrollbar-track) {
		background: #f1f5f9;
		border-radius: 3px;
	}

	:global(.code-block-wrapper pre::-webkit-scrollbar-thumb) {
		background: #cbd5e1;
		border-radius: 3px;
	}

	:global(.code-block-wrapper pre::-webkit-scrollbar-thumb:hover) {
		background: #94a3b8;
	}

	/* ===== 旧版滚动条样式（保留兼容） ===== */
	:global(.custom-scrollbar::-webkit-scrollbar) {
		height: 8px;
	}
	:global(.custom-scrollbar::-webkit-scrollbar-track) {
		background: transparent;
	}
	:global(.custom-scrollbar::-webkit-scrollbar-thumb) {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 20px;
		border: 2px solid #1a1b26;
	}
	:global(.custom-scrollbar::-webkit-scrollbar-thumb:hover) {
		background: rgba(255, 255, 255, 0.2);
	}
</style>
