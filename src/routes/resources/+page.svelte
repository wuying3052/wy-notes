<script lang="ts">
	import { Search, ExternalLink, Sparkles, FolderOpen, X, ChevronRight } from 'lucide-svelte';
	import { page } from '$app/state';
	import { fly, fade, scale } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { SITE_CONFIG } from '$lib/config/site';
	import type { ResourceSection } from '$lib/types/resources';

	let { data } = $props();

	// 构建完整的页面 URL 和 OG 图片 URL
	let pageUrl = $derived(`${SITE_CONFIG.url}${page.url.pathname}`);
	let ogImage = $derived(SITE_CONFIG.ogImage);
	const pageTitle = '工具与灵感 | WY NOTES';
	const pageDescription = '收藏优质的开发工具、设计灵感和技术资源，提升开发效率。';

	// 获取资源数据
	let { resources = [] } = $derived(data as { resources?: ResourceSection[] });

	// 状态管理
	let activeCategory = $state('全部');
	let searchQuery = $state('');

	// 派生数据：所有分类列表
	const categories = $derived(['全部', ...new Set(resources.map((section) => section.category))]);

	// 派生数据：根据搜索和分类过滤资源
	let filteredResources = $derived(
		resources
			.map((section) => {
				// 搜索关键词筛选
				const q = searchQuery.toLowerCase();
				const filteredItems = section.items.filter(
					(item) =>
						item.title.toLowerCase().includes(q) ||
						item.desc.toLowerCase().includes(q) ||
						item.tags.some((t) => t.toLowerCase().includes(q))
				);

				if (filteredItems.length === 0) return null;

				return { ...section, items: filteredItems };
			})
			.filter((section): section is ResourceSection => Boolean(section))
	);

	/**
	 * 滚动到指定分类
	 */
	function scrollToCategory(category: string) {
		if (category === '全部') {
			window.scrollTo({ top: 0, behavior: 'smooth' });
			activeCategory = '全部';
			return;
		}

		const sectionId = `category-${category}`;
		const element = document.getElementById(sectionId);
		if (element) {
			const offset = 100; // 顶部偏移量
			const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
			const offsetPosition = elementPosition - offset;

			window.scrollTo({
				top: offsetPosition,
				behavior: 'smooth'
			});
		}
		activeCategory = category;
	}

	/**
	 * 监听滚动，更新当前激活的分类
	 */
	$effect(() => {
		const handleScroll = () => {
			if (searchQuery) return; // 搜索时不自动更新分类

			const sections = resources
				.map((section) => {
					const element = document.getElementById(`category-${section.category}`);
					if (!element) return null;

					const rect = element.getBoundingClientRect();
					return {
						category: section.category,
						top: rect.top,
						bottom: rect.bottom
					};
				})
				.filter(Boolean);

			// 找到当前视口中最靠近顶部的分类
			const current = sections.find(
				(section) => section && section.top <= 200 && section.bottom > 0
			);

			if (current) {
				activeCategory = current.category;
			} else if (window.scrollY < 200) {
				activeCategory = '全部';
			}
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	});

	/**
	 * 检测元素文字是否溢出的 Action
	 * 如果文字被截断（溢出），则在父元素上添加 'has-overflow' 类
	 */
	function monitorTruncation(node: HTMLElement) {
		const update = () => {
			// 比较滚动高度和视口高度来判断是否溢出
			const isOverflowing = node.scrollHeight > node.clientHeight;
			if (isOverflowing) {
				node.parentElement?.classList.add('has-overflow');
			} else {
				node.parentElement?.classList.remove('has-overflow');
			}
		};

		// 使用 ResizeObserver 监听尺寸变化（如响应式布局调整）
		const observer = new ResizeObserver(update);
		observer.observe(node);

		// 初始检查
		update();

		return {
			destroy() {
				observer.disconnect();
			}
		};
	}
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<link rel="canonical" href={pageUrl} />
	<meta name="description" content={pageDescription} />

	<!-- Open Graph / 社交分享 -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content={pageUrl} />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={pageDescription} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:secure_url" content={ogImage} />
	<meta property="og:image:type" content={SITE_CONFIG.ogImageType} />
	<meta property="og:image:width" content={SITE_CONFIG.ogImageWidth} />
	<meta property="og:image:height" content={SITE_CONFIG.ogImageHeight} />
	<meta property="og:image:alt" content="WY NOTES 工具与灵感" />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content={pageUrl} />
	<meta property="twitter:title" content={pageTitle} />
	<meta property="twitter:description" content={pageDescription} />
	<meta property="twitter:image" content={ogImage} />
	<meta property="twitter:image:alt" content="WY NOTES 工具与灵感" />
</svelte:head>

<div class="min-h-screen flex flex-col bg-slate-50/50 overflow-x-hidden">
	<!-- 顶部标题区域：更加精致的排版 -->
	<header class="w-full">
		<div class="max-w-[1440px] mx-auto px-6 pt-8 pb-4">
			<div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
				<!-- 左侧：搜索框 -->
				<div
					in:fly={{ x: -20, duration: 600, delay: 100 }}
					class="relative group w-full md:w-80 lg:w-96 shrink-0 mb-4 md:mb-0"
				>
					<div
						class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors duration-300"
					>
						<Search size={16} strokeWidth={2.5} />
					</div>
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="搜索资源..."
						class="block w-full rounded-xl border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm shadow-sm shadow-slate-100 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 text-slate-800 placeholder:text-slate-400 font-medium"
					/>
					{#if searchQuery}
						<button
							class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-transform hover:scale-110"
							onclick={() => (searchQuery = '')}
							aria-label="清空搜索"
						>
							<div class="bg-slate-100 rounded-full p-0.5">
								<X size={12} strokeWidth={3} />
							</div>
						</button>
					{/if}
				</div>

				<!-- 右侧：标题与简介 -->
				<div
					in:fly={{ y: -20, duration: 600, delay: 200 }}
					class="max-w-3xl flex flex-col items-start md:items-end text-left md:text-right"
				>
					<div
						class="inline-flex items-center gap-1.5 text-slate-500 text-[10px] font-bold mb-2 uppercase tracking-widest"
					>
						<Sparkles size={10} class="text-amber-500" />
						<span>Curated Resources</span>
					</div>
					<h1
						class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mb-2"
					>
						工具与灵感库
					</h1>
					<p class="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-xl font-medium">
						汇集优质的设计灵感、开发框架与效率工具，助你构建更好的数字产品。
					</p>
				</div>
			</div>
		</div>
	</header>

	<!-- 主体布局 -->
	<div class="flex flex-1 w-full max-w-[1440px] mx-auto pt-4 lg:pt-8">
		<!-- 1. 核心内容展示区 -->
		<main class="flex-1 px-4 sm:px-6 lg:px-10 pb-24 min-w-0">
			<div class="w-full lg:max-w-6xl lg:mx-auto xl:mx-0">
				<!-- 移动端分类导航 (仅在小屏幕显示) -->
				<div class="lg:hidden mb-8 overflow-x-auto pb-2 -mx-4 px-4 hide-scrollbar">
					<div class="flex gap-2">
						{#each categories as cat}
							<button
								onclick={() => scrollToCategory(cat)}
								class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold border transition-all duration-200 {activeCategory ===
								cat
									? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20'
									: 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}"
							>
								{cat}
							</button>
						{/each}
					</div>
				</div>

				<!-- 资源列表 -->
				<div class="space-y-12">
					{#if filteredResources.length > 0}
						{#each filteredResources as section (section.category)}
							<section id="category-{section.category}">
								<div class="flex items-center gap-3 mb-5 group/title">
									<h2 class="text-xl font-bold text-slate-900 flex items-center gap-2">
										<span class="bg-indigo-600 w-1 h-5 rounded-full"></span>
										{section.category}
									</h2>
									<span
										class="text-xs font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full"
										>{section.items.length}</span
									>
									<div class="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent"></div>
								</div>

								<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
									{#each section.items as item (item.url)}
										<div
											animate:flip={{ duration: 400 }}
											in:scale={{ duration: 300, start: 0.9 }}
											out:fade={{ duration: 200 }}
										>
											<a
												href={item.url}
												target="_blank"
												rel="external noopener noreferrer"
												class="group flex flex-col p-6 bg-white rounded-2xl border border-slate-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 h-full"
											>
												<div class="flex items-start gap-4 mb-4">
													<!-- 左侧图标 -->
													<div class="shrink-0 relative mt-0.5">
														{#if item.icon}
															<div
																class="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 group-hover:bg-white group-hover:shadow-sm transition-all"
															>
																<img
																	src={item.icon}
																	alt={item.title}
																	class="w-full h-full object-contain"
																/>
															</div>
														{:else}
															<div
																class="w-14 h-14 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
															>
																<FolderOpen size={28} />
															</div>
														{/if}
													</div>

													<!-- 右侧内容 -->
													<div class="flex-1 min-w-0">
														<div class="flex items-start justify-between gap-2 mb-1">
															<h3
																class="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 leading-snug"
															>
																{item.title}
															</h3>
															<div
																class="shrink-0 text-slate-300 group-hover:text-indigo-500 transition-colors duration-300 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 pt-0.5"
															>
																<ExternalLink size={14} />
															</div>
														</div>

														<!-- 描述文本带 Tooltip -->
														<div class="relative group/desc">
															<p
																use:monitorTruncation
																class="text-[13px] text-slate-500 line-clamp-2 leading-[21px] h-[42px] group-[.has-overflow]/desc:cursor-help"
															>
																{item.desc}
															</p>

															<!-- 自定义提示框：仅当文字溢出且悬停时显示 -->
															<div
																class="hidden md:block absolute left-[105%] top-0 w-60 bg-white text-slate-600 text-[11px] leading-relaxed p-3 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] opacity-0 invisible -translate-x-2 scale-95 group-[.has-overflow]/desc:group-hover/desc:opacity-100 group-[.has-overflow]/desc:group-hover/desc:visible group-[.has-overflow]/desc:group-hover/desc:translate-x-0 group-[.has-overflow]/desc:group-hover/desc:scale-100 transition-all duration-300 delay-500 z-50 pointer-events-none border border-slate-100 origin-left select-none"
															>
																{item.desc}
																<!-- 箭头 -->
																<div
																	class="absolute top-3 -left-1.5 w-3 h-3 bg-white border-l border-b border-slate-100 rotate-45"
																></div>
															</div>
														</div>
													</div>
												</div>

												<div class="flex flex-wrap gap-2 mt-auto pt-3 border-t border-slate-50">
													{#each item.tags as tag}
														<span
															class="inline-flex items-center text-xs font-medium text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-md group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors"
														>
															{tag}
														</span>
													{/each}
												</div>
											</a>
										</div>
									{/each}
								</div>
							</section>
						{/each}
					{:else}
						<div class="flex flex-col items-center justify-center py-32 text-center">
							<div
								class="w-24 h-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-6 animate-pulse"
							>
								<Search size={48} strokeWidth={1.5} />
							</div>
							<h3 class="text-xl font-bold text-slate-900 mb-2">没有找到相关资源</h3>
							<p class="text-slate-500 max-w-sm mb-8">我们找不到与 "{searchQuery}" 匹配的内容。</p>
							<button
								onclick={() => {
									searchQuery = '';
									activeCategory = '全部';
								}}
								class="px-8 py-2.5 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 transition-all transform hover:-translate-y-0.5"
							>
								清除所有筛选
							</button>
						</div>
					{/if}
				</div>
			</div>
		</main>

		<!-- 2. 分类侧边栏 (桌面端) -->
		<aside class="hidden lg:block w-72 shrink-0 pl-12 box-border pr-2 relative z-0">
			<div class="sticky top-28">
				<div class="flex items-center justify-between mb-4 px-2">
					<h3 class="font-bold text-slate-900 text-xs uppercase tracking-wider">分类导航</h3>
					<span
						class="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full"
						>{categories.length}</span
					>
				</div>

				<nav class="flex flex-col gap-1 relative border-l border-slate-200/60 ml-2 pl-3">
					{#each categories as cat}
						<button
							class="group flex items-center gap-3 w-full pl-2 pr-3 py-2 rounded-md text-[13px] font-medium transition-all duration-200 text-left relative overflow-hidden {activeCategory ===
							cat
								? 'text-indigo-600 bg-indigo-50/50'
								: 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}"
							onclick={() => scrollToCategory(cat)}
						>
							{#if activeCategory === cat}
								<div
									class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-indigo-500 rounded-full"
								></div>
							{/if}

							<span
								class="relative z-10 flex-1 truncate transition-transform duration-200 {activeCategory ===
								cat
									? 'translate-x-1'
									: 'group-hover:translate-x-1'}">{cat}</span
							>

							{#if activeCategory === cat}
								<ChevronRight size={14} class="relative z-10 text-indigo-400" />
							{/if}
						</button>
					{/each}
				</nav>
			</div>
		</aside>
	</div>
</div>
