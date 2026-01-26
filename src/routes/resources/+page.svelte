<script lang="ts">
	import { Search, ExternalLink, LayoutGrid } from 'lucide-svelte';

	let { data } = $props();
	type ResourceItem = {
		title: string;
		desc: string;
		url: string;
		icon: string;
		tags: string[];
	};

	type ResourceSection = {
		category: string;
		items: ResourceItem[];
	};

	let { resources = [] } = $derived(data as { resources?: ResourceSection[] });

	let activeCategory = $state('全部');
	let searchQuery = $state('');

	const categories = $derived(['全部', ...new Set(resources.map((section) => section.category))]);

	let filteredResources = $derived(
		resources
			.map((section) => {
				// 如果当前分类是 '全部'，则显示所有部分但根据搜索内容进行过滤
				// 如果当前分类是特定分类，则只显示该部分
				if (activeCategory !== '全部' && section.category !== activeCategory) {
					return null;
				}

				const filteredItems = section.items.filter(
					(item) =>
						item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
						item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
						item.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()))
				);

				if (filteredItems.length === 0) return null;

				return { ...section, items: filteredItems };
			})
			.filter((section): section is ResourceSection => Boolean(section))
	);
</script>

<div class="max-w-7xl mx-auto px-4 py-12 min-h-screen">
	<div class="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
		<div>
			<h1 class="text-3xl font-bold text-slate-900 mb-2">资源导航</h1>
			<p class="text-sm text-slate-500">精选开发与设计工具箱</p>
		</div>

		<div class="relative w-full md:w-80">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="搜索工具..."
				class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all shadow-sm"
			/>
		</div>
	</div>

	<div class="flex flex-col lg:flex-row gap-10">
		<aside class="lg:w-48 flex-shrink-0 space-y-8 lg:order-last">
			<!-- 分类 -->
			<nav class="space-y-1">
				<h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">分类</h3>
				{#each categories as cat (cat)}
					<button
						class="w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-between group"
						class:bg-brand={activeCategory === cat}
						class:text-white={activeCategory === cat}
						class:text-slate-600={activeCategory !== cat}
						class:hover:bg-slate-100={activeCategory !== cat}
						onclick={() => (activeCategory = cat)}
					>
						<span>{cat}</span>
						{#if activeCategory === cat}
							<LayoutGrid size={14} />
						{/if}
					</button>
				{/each}
			</nav>
		</aside>

		<!-- 主要内容 -->
		<main class="flex-grow space-y-12">
			{#each filteredResources as section (section.category)}
				<section class="animate-in fade-in slide-in-from-bottom-4 duration-500">
					<div class="flex items-center space-x-3 mb-6">
						<h2 class="text-xl font-bold text-slate-900">{section.category}</h2>
						<div class="h-px bg-slate-100 flex-grow"></div>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{#each section.items as item (item.url)}
							<a
								href={item.url}
								target="_blank"
								rel="external noopener noreferrer"
								class="group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
							>
								<div class="flex items-start justify-between mb-4">
									<div
										class="w-12 h-12 rounded-xl bg-slate-50 p-2 flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform"
									>
										{#if item.icon}
											<img src={item.icon} alt={item.title} class="w-full h-full object-contain" />
										{:else}
											<div class="text-[10px] text-slate-300 font-bold">ICON</div>
										{/if}
									</div>
									<ExternalLink
										size={16}
										class="text-slate-300 group-hover:text-brand transition-colors"
									/>
								</div>

								<div class="flex-grow">
									<h3
										class="font-bold text-slate-900 mb-1 group-hover:text-brand transition-colors"
									>
										{item.title}
									</h3>
									<p
										class="text-sm text-slate-500 mb-4 leading-relaxed overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]"
									>
										{item.desc}
									</p>
								</div>

								<div class="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-50">
									{#each item.tags as tag, index (index)}
										<span
											class="px-2 py-0.5 rounded-md bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wide"
										>
											{tag}
										</span>
									{/each}
								</div>
							</a>
						{/each}
					</div>
				</section>
			{:else}
				<div class="flex flex-col items-center justify-center py-32 text-slate-400 w-full">
					<Search size={48} class="mb-4 opacity-20" />
					{#if resources.length === 0}
						<p class="text-lg font-medium">暂无资源数据</p>
					{:else}
						<p class="text-lg font-medium">没有找到匹配的资源</p>
						{#if searchQuery || activeCategory !== '全部'}
							<button
								onclick={() => {
									searchQuery = '';
									activeCategory = '全部';
								}}
								class="mt-4 text-brand font-bold hover:text-brand-light transition-colors"
							>
								清除所有筛选
							</button>
						{/if}
					{/if}
				</div>
			{/each}
		</main>
	</div>
</div>
