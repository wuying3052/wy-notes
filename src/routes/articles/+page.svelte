<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Search } from 'lucide-svelte';
	import { fly, fade, scale } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import ArticleCard from '$lib/components/articles/ArticleCard.svelte';
	import { SITE_CONFIG } from '$lib/config/site';
	let { data } = $props();

	// 构建完整的页面 URL 和 OG 图片 URL
	let pageUrl = $derived(`${SITE_CONFIG.url}${page.url.pathname}`);
	let ogImage = $derived(SITE_CONFIG.ogImage);

	type ArticleItem = {
		id: string;
		title: string;
		slug: string;
		excerpt: string;
		cover_image: string;
		created_at: string;
		category: string;
		tags: string[];
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

<svelte:head>
	<title>精选文章 | WY NOTES</title>
	<meta
		name="description"
		content="浏览 WY NOTES 的精选技术文章，涵盖 Svelte, Tailwind, Web 开发等前沿技术。"
	/>

	<!-- Open Graph / 社交分享 -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content={pageUrl} />
	<meta property="og:title" content="精选文章 | WY NOTES" />
	<meta
		property="og:description"
		content="浏览 WY NOTES 的精选技术文章，涵盖 Svelte, Tailwind, Web 开发等前沿技术。"
	/>
	<meta property="og:image" content={ogImage} />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content={pageUrl} />
	<meta property="twitter:title" content="精选文章 | WY NOTES" />
	<meta
		property="twitter:description"
		content="浏览 WY NOTES 的精选技术文章，涵盖 Svelte, Tailwind, Web 开发等前沿技术。"
	/>
	<meta property="twitter:image" content={ogImage} />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-12">
	<header class="mb-12 space-y-8">
		<div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
			<div in:fly={{ y: -20, duration: 600, delay: 100 }}>
				<h1 class="text-4xl font-bold text-slate-900 mb-2">精选文章</h1>
				<p class="text-lg text-slate-500">探索技术见解与设计灵感。</p>
			</div>

			<div class="relative w-full md:w-72" in:fly={{ x: 20, duration: 600, delay: 200 }}>
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
			{#each categories as cat, i (cat)}
				<button
					in:scale={{ duration: 400, delay: 300 + i * 50, start: 0.8 }}
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
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each filteredArticles as article (article.id)}
					<div
						animate:flip={{ duration: 400 }}
						in:fly={{ y: 20, duration: 400 }}
						out:fade={{ duration: 200 }}
					>
						<ArticleCard {article} />
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>
