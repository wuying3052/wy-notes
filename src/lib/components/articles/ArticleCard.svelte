<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';

	type ArticleItem = {
		title: string;
		slug: string;
		excerpt: string;
		cover_image: string;
		created_at: string;
		tags?: string[];
	};

	let { article, imageAspect = 'aspect-[2.2/1]' } = $props<{
		article: ArticleItem;
		imageAspect?: string;
	}>();
</script>

<Card.Root
	class="group h-full flex flex-col overflow-hidden rounded-2xl border-slate-100 bg-white p-0 gap-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50"
>
	<a
		href={resolve(`/articles/${article.slug}`)}
		class="relative block {imageAspect} w-full overflow-hidden"
	>
		<img
			src={article.cover_image}
			alt={article.title}
			class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
		/>
		<div
			class="absolute inset-0 bg-slate-900/0 transition-colors duration-500 group-hover:bg-slate-900/5"
		></div>
	</a>

	<Card.Content class="flex flex-grow flex-col p-5 pt-4">
		<Card.Title class="mb-1.5 leading-tight">
			<a
				href={resolve(`/articles/${article.slug}`)}
				class="text-lg font-extrabold text-slate-900 transition-colors focus:outline-none group-hover:text-brand"
			>
				{article.title}
			</a>
		</Card.Title>

		<Card.Description
			class="mb-2 line-clamp-3 min-h-[4.5em] flex-grow leading-relaxed text-slate-600 text-sm"
		>
			{article.excerpt}
		</Card.Description>

		{#if article.tags && article.tags.length > 0}
			<div class="mb-2 flex flex-wrap gap-2 overflow-hidden h-6">
				{#each article.tags as tag}
					<span
						class="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 transition-colors group-hover:bg-brand/10 group-hover:text-brand"
					>
						#{tag}
					</span>
				{/each}
			</div>
		{/if}

		<Card.Footer class="mt-auto flex items-center justify-between p-0 pt-1">
			<span class="font-mono text-sm font-medium text-slate-400">
				{new Date(article.created_at).toLocaleDateString()}
			</span>

			<a
				href={resolve(`/articles/${article.slug}`)}
				class="flex items-center text-xs font-bold text-brand transition-transform duration-300 group-hover:translate-x-1"
			>
				<span>阅读文章</span>
				<ArrowRight size={14} class="ml-1" />
			</a>
		</Card.Footer>
	</Card.Content>
</Card.Root>
