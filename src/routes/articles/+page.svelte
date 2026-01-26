<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight, Search } from 'lucide-svelte';
	let { data } = $props();

	type ArticleItem = {
		id: string;
		title: string;
		slug: string;
		excerpt: string;
		cover_image: string;
		created_at: string;
		category: string;
	};

	let articles = $derived((data.articles as ArticleItem[] | undefined) ?? []);

	let activeCategory = $state('全部');
	let searchQuery = $state('');

	let categories = $derived.by(() => {
		const unique: string[] = [];
		for (const a of articles) {
			if (!unique.includes(a.category)) unique.push(a.category);
		}
		unique.sort();
		return ['全部', ...unique];
	});

	let filteredArticles = $derived(
		articles.filter((a) => {
			const matchesCategory = activeCategory === '全部' || a.category === activeCategory;
			const q = searchQuery.trim().toLowerCase();
			const matchesSearch =
				!q || a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q);
			return matchesCategory && matchesSearch;
		})
	);
</script>

<div class="max-w-7xl mx-auto px-4 py-12 min-h-screen">
	<header class="mb-12 space-y-8">
		<div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
			<div>
				<h1 class="text-4xl font-bold text-slate-900 mb-2">精选文章</h1>
				<p class="text-lg text-slate-500">探索技术见解与设计灵感。</p>
			</div>

			<div class="relative w-full md:w-72">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="搜索文章..."
					class="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all shadow-sm"
				/>
			</div>
		</div>

		<div class="flex flex-wrap items-center gap-3">
			{#each categories as cat (cat)}
				<button
					class="px-5 py-2 rounded-full text-sm font-bold transition-all border"
					class:bg-brand={activeCategory === cat}
					class:text-white={activeCategory === cat}
					class:border-brand={activeCategory === cat}
					class:bg-white={activeCategory !== cat}
					class:text-slate-600={activeCategory !== cat}
					class:border-slate-200={activeCategory !== cat}
					class:hover:bg-slate-50={activeCategory !== cat}
					class:hover:border-slate-300={activeCategory !== cat}
					onclick={() => (activeCategory = cat)}
				>
					{cat}
				</button>
			{/each}
		</div>
	</header>

	<main>
		{#if filteredArticles.length === 0}
			<div class="flex flex-col items-center justify-center py-24 text-slate-400">
				<Search size={48} class="mb-4 opacity-20" />
				<p class="text-lg font-medium">没有找到匹配的文章</p>
				{#if searchQuery || activeCategory !== '全部'}
					<button
						onclick={() => {
							searchQuery = '';
							activeCategory = '全部';
						}}
						class="mt-4 text-brand font-bold hover:text-brand-light transition-colors"
					>
						清除筛选
					</button>
				{/if}
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				{#each filteredArticles as article (article.id)}
					<article
						class="group rounded-3xl bg-white border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-500 flex flex-col h-full"
					>
						<a
							href={resolve(`/articles/${article.slug}`)}
							class="block aspect-video overflow-hidden relative"
						>
							<img
								src={article.cover_image}
								alt={article.title}
								class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
							/>
							<div
								class="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-colors duration-500"
							></div>
						</a>

						<div class="p-6 flex-grow flex flex-col">
							<div
								class="flex items-center space-x-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4"
							>
								<span
									class="px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-slate-600"
								>
									{article.category}
								</span>
								<span class="w-1 h-1 rounded-full bg-slate-300"></span>
								<span>{new Date(article.created_at).toLocaleDateString()}</span>
							</div>

							<h2
								class="text-xl font-bold text-slate-900 mb-4 group-hover:text-brand transition-colors leading-snug"
							>
								<a href={resolve(`/articles/${article.slug}`)} class="focus:outline-none">
									{article.title}
								</a>
							</h2>

							<p class="text-sm text-slate-500 mb-6 flex-grow leading-relaxed line-clamp-3">
								{article.excerpt}
							</p>

							<a
								href={resolve(`/articles/${article.slug}`)}
								class="flex items-center text-sm font-bold text-brand group-hover:translate-x-1 transition-transform duration-300 mt-auto inline-block w-max"
							>
								<span>阅读文章</span>
								<ArrowRight size={16} class="ml-1.5" />
							</a>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</main>
</div>
