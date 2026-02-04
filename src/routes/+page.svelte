<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight, Sparkles, BookText, Briefcase, Compass } from 'lucide-svelte';
	import { Layers, Zap, Palette, Component, FileJson, Server } from 'lucide-svelte';
	import ArticleCard from '$lib/components/articles/ArticleCard.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';

	let { data } = $props();
	let { recentPosts, projects } = $derived(data);

	const techStack = [
		{
			name: 'SvelteKit',
			desc: '全栈框架',
			icon: Layers,
			bg: 'bg-orange-50',
			color: 'text-orange-500',
			border: 'border-orange-100'
		},
		{
			name: 'Svelte 5',
			desc: '响应式核心',
			icon: Zap,
			bg: 'bg-amber-50',
			color: 'text-amber-500',
			border: 'border-amber-100'
		},
		{
			name: 'Tailwind 4',
			desc: '原子化样式',
			icon: Palette,
			bg: 'bg-cyan-50',
			color: 'text-cyan-500',
			border: 'border-cyan-100'
		},
		{
			name: 'Unified',
			desc: 'Markdown 管线',
			icon: Component,
			bg: 'bg-zinc-50',
			color: 'text-zinc-500',
			border: 'border-zinc-100'
		},
		{
			name: 'Markdown',
			desc: '内容解析',
			icon: FileJson,
			bg: 'bg-yellow-50',
			color: 'text-yellow-600',
			border: 'border-yellow-100'
		},
		{
			name: 'Vercel',
			desc: '静态部署',
			icon: Server,
			bg: 'bg-black/5',
			color: 'text-slate-900',
			border: 'border-slate-200'
		}
	];
</script>

<div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
	<section class="grid grid-cols-1 gap-12 items-center lg:grid-cols-2 lg:gap-20">
		<div class="space-y-8">
			<div
				class="inline-flex items-center gap-2 rounded-full border border-brand/10 bg-brand/5 px-3 py-1 text-xs font-bold text-brand"
			>
				<span class="relative flex h-2 w-2">
					<span
						class="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75"
					></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-brand"></span>
				</span>
				<span>持续更新 · 结构化沉淀</span>
			</div>

			<h1
				class="text-4xl font-black tracking-tighter text-slate-900 leading-[1.05] sm:text-5xl lg:text-7xl"
			>
				让知识更可检索，<br />让实践更可复用
			</h1>

			<p class="max-w-xl text-lg font-medium leading-relaxed text-slate-500 sm:text-xl">
				这里收录文章、项目与资源，以清晰的信息结构组织内容，便于快速浏览与回溯。
			</p>

			<div class="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
				<Button
					href="/articles"
					class="gap-2 rounded-2xl px-8 py-6 text-sm font-bold shadow-xl shadow-slate-900/10 transition-all hover:-translate-y-0.5"
				>
					<span>浏览文章</span>
					<ArrowRight size={18} />
				</Button>
				<Button
					href="/projects"
					variant="secondary"
					class="gap-2 rounded-2xl border border-slate-200 bg-white px-8 py-6 text-sm font-bold text-slate-900 transition-all hover:-translate-y-0.5 hover:bg-slate-50"
				>
					<span>查看项目</span>
					<ArrowRight size={18} />
				</Button>
			</div>
		</div>

		<div class="relative hidden lg:block">
			<!-- 装饰背景 -->
			<div
				class="absolute inset-0 transform rotate-3 scale-105 rounded-[40px] bg-gradient-to-tr from-brand/5 to-purple-500/5"
			></div>

			<Card.Root
				class="relative rounded-[32px] border-slate-100 p-8 shadow-2xl shadow-slate-200/50"
			>
				<Card.Content class="grid grid-cols-1 gap-6 p-0">
					<a
						href={resolve('/articles')}
						class="group flex cursor-pointer items-center justify-between rounded-2xl p-4 transition-colors hover:bg-slate-50"
					>
						<div class="flex items-center gap-5">
							<div
								class="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/5 text-brand transition-transform duration-300 group-hover:scale-110"
							>
								<BookText size={24} />
							</div>
							<div>
								<div
									class="text-base font-extrabold text-slate-900 transition-colors group-hover:text-brand"
								>
									文章
								</div>
								<div class="mt-0.5 text-xs font-medium text-slate-400">
									近期更新 {recentPosts.length} 篇
								</div>
							</div>
						</div>
						<div
							class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-all group-hover:border-brand group-hover:text-brand"
						>
							<ArrowRight size={14} />
						</div>
					</a>

					<div class="h-px bg-slate-50"></div>

					<a
						href={resolve('/projects')}
						class="group flex cursor-pointer items-center justify-between rounded-2xl p-4 transition-colors hover:bg-slate-50"
					>
						<div class="flex items-center gap-5">
							<div
								class="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/5 text-blue-500 transition-transform duration-300 group-hover:scale-110"
							>
								<Briefcase size={24} />
							</div>
							<div>
								<div
									class="text-base font-extrabold text-slate-900 transition-colors group-hover:text-blue-500"
								>
									项目
								</div>
								<div class="mt-0.5 text-xs font-medium text-slate-400">
									精选展示 {projects.length} 个
								</div>
							</div>
						</div>
						<div
							class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-all group-hover:border-blue-500 group-hover:text-blue-500"
						>
							<ArrowRight size={14} />
						</div>
					</a>

					<div class="h-px bg-slate-50"></div>

					<a
						href={resolve('/resources')}
						class="group flex cursor-pointer items-center justify-between rounded-2xl p-4 transition-colors hover:bg-slate-50"
					>
						<div class="flex items-center gap-5">
							<div
								class="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/5 text-orange-500 transition-transform duration-300 group-hover:scale-110"
							>
								<Compass size={24} />
							</div>
							<div>
								<div
									class="text-base font-extrabold text-slate-900 transition-colors group-hover:text-orange-500"
								>
									资源
								</div>
								<div class="mt-0.5 text-xs font-medium text-slate-400">整理链接与工具清单</div>
							</div>
						</div>
						<div
							class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-all group-hover:border-orange-500 group-hover:text-orange-500"
						>
							<ArrowRight size={14} />
						</div>
					</a>
				</Card.Content>
			</Card.Root>
		</div>
	</section>

	<section class="mt-14 grid grid-cols-1 gap-6 sm:mt-18 lg:grid-cols-3">
		<Card.Root class="glass decoration-clone rounded-3xl border-white/60 p-7 lg:col-span-2">
			<Card.Content class="p-0">
				<div class="mb-6 flex items-center justify-between gap-4">
					<h2 class="flex items-center gap-2 text-lg font-extrabold text-slate-900">
						<Sparkles class="text-brand" size={18} />
						<span>最新文章</span>
					</h2>
					<Button
						href="/articles"
						variant="ghost"
						size="sm"
						class="text-xs font-bold text-slate-500 hover:text-slate-900"
					>
						查看全部
					</Button>
				</div>

				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					{#each recentPosts as post (post.slug)}
						<ArticleCard article={post} imageAspect="aspect-[2/1]" />
					{/each}
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root
			class="relative flex h-full flex-col overflow-hidden rounded-3xl border-slate-200/80 bg-gradient-to-br from-slate-50 to-blue-50/50 p-8 shadow-xl shadow-slate-100/50"
		>
			<div class="absolute -top-14 -right-14 h-48 w-48 rounded-full bg-blue-100/50 blur-3xl"></div>
			<Card.Header class="p-0">
				<Card.Title class="mb-8 text-xl font-extrabold text-slate-900">精选项目</Card.Title>
			</Card.Header>
			<Card.Content class="flex-grow space-y-6 p-0">
				{#each projects as project (project.name)}
					<div class="flex items-start gap-4">
						<div class="mt-2 h-3 w-3 rounded-full {project.color}"></div>
						<div class="min-w-0">
							<div class="truncate text-base font-bold text-slate-900">{project.name}</div>
							{#if project.desc}
								<div
									class="mt-1.5 overflow-hidden text-ellipsis text-sm text-slate-500 [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]"
								>
									{project.desc}
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</Card.Content>
			<Card.Footer class="p-0">
				<Button
					href="/projects"
					size="sm"
					class="mt-8 self-start gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
				>
					<span>查看项目库</span>
					<ArrowRight size={16} />
				</Button>
			</Card.Footer>
		</Card.Root>
	</section>

	<section class="mt-14 sm:mt-18">
		<div class="mb-8 flex items-center gap-3">
			<div class="h-8 w-1 rounded-full bg-brand"></div>
			<h2 class="text-xl font-extrabold text-slate-900">本站研发技术栈</h2>
			<span class="text-sm font-medium text-slate-500">现代全栈开发工具集</span>
		</div>

		<div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
			{#each techStack as tech (tech.name)}
				<Card.Root
					class="group relative overflow-hidden rounded-2xl border {tech.border} bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
				>
					<div
						class="absolute inset-0 {tech.bg} opacity-0 transition-opacity duration-300 group-hover:opacity-100"
					></div>
					<Card.Content class="relative flex flex-col items-start gap-3 p-4">
						<div class="rounded-xl p-2.5 {tech.bg} {tech.color}">
							<tech.icon size={20} />
						</div>
						<div>
							<div class="text-sm font-bold text-slate-900">{tech.name}</div>
							<div class="mt-0.5 text-xs text-slate-500">{tech.desc}</div>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	</section>
</div>
