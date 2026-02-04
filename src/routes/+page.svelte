<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight, Sparkles, BookText, Briefcase, Compass } from 'lucide-svelte';
	import { Layers, Zap, Palette, Component, FileJson, Server } from 'lucide-svelte';
	import { fly, fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import ArticleCard from '$lib/components/articles/ArticleCard.svelte';
	import Reveal from '$lib/components/ui/Reveal.svelte';
	import TiltCard from '$lib/components/ui/TiltCard.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';

	let { data } = $props();
	let { recentPosts, projects } = $derived(data);
	let ready = $state(false);

	onMount(() => {
		ready = true;
	});

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

<svelte:head>
	<style>
		:root {
			--spotlight-color: 24, 24, 27; /* Slate-900 */
		}
		.dark {
			--spotlight-color: 255, 255, 255;
		}
	</style>
</svelte:head>

{#if ready}
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
		<section class="grid grid-cols-1 gap-12 items-center lg:grid-cols-2 lg:gap-20">
			<div class="space-y-8">
				<div
					in:fly={{ x: -50, duration: 800, delay: 0 }}
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
					in:fly={{ x: -50, duration: 800, delay: 100 }}
					class="text-shimmer text-4xl font-black tracking-tighter leading-[1.05] sm:text-5xl lg:text-7xl"
				>
					让知识更可检索，<br />让实践更可复用
				</h1>

				<p
					class="max-w-xl text-lg font-medium leading-relaxed text-slate-500 sm:text-xl"
					in:fly={{ y: 20, duration: 800, delay: 200 }}
				>
					这里收录文章、项目与资源，以清晰的信息结构组织内容，便于快速浏览与回溯。
				</p>

				<div
					class="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center"
					in:fly={{ y: 20, duration: 800, delay: 300 }}
				>
					<Button
						href="/articles"
						class="gap-2 rounded-2xl bg-brand px-8 py-6 text-sm font-bold text-white shadow-xl shadow-brand/20 transition-all hover:-translate-y-0.5 hover:bg-brand/90 hover:shadow-2xl hover:shadow-brand/30"
					>
						<span>浏览文章</span>
						<ArrowRight size={18} />
					</Button>
					<Button
						href="/projects"
						variant="secondary"
						class="gap-2 rounded-2xl border border-slate-200 bg-white/80 px-8 py-6 text-sm font-bold text-slate-900 shadow-lg shadow-slate-200/20 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-xl hover:shadow-slate-200/30"
					>
						<span>查看项目</span>
						<ArrowRight size={18} />
					</Button>
				</div>
			</div>

			<div class="relative hidden lg:grid lg:grid-cols-1 lg:gap-5">
				<!-- 装饰背景 -->
				<div
					class="absolute -inset-4 transform rotate-6 scale-105 rounded-[40px] bg-gradient-to-tr from-brand/5 to-purple-500/5 blur-2xl transition-transform duration-1000"
				></div>

				<!-- 文章卡片 -->
				<a
					href={resolve('/articles')}
					in:fly={{ x: 50, duration: 800, delay: 500 }}
					class="group relative flex items-center justify-between rounded-3xl border border-white/60 bg-white/60 p-5 shadow-lg shadow-slate-200/40 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-white/80 hover:shadow-xl hover:shadow-brand/10"
				>
					<div class="flex items-center gap-5">
						<div
							class="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
						>
							<BookText size={28} />
						</div>
						<div>
							<div
								class="text-lg font-extrabold text-slate-900 group-hover:text-brand transition-colors"
							>
								文章
							</div>
							<div class="mt-1 text-sm font-medium text-slate-500">
								近期更新 {recentPosts.length} 篇
							</div>
						</div>
					</div>
					<div
						class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-all group-hover:bg-brand group-hover:text-white"
					>
						<ArrowRight size={18} />
					</div>
				</a>

				<!-- 项目卡片 -->
				<a
					href={resolve('/projects')}
					in:fly={{ x: 50, duration: 800, delay: 600 }}
					class="group relative flex items-center justify-between rounded-3xl border border-white/60 bg-white/60 p-5 shadow-lg shadow-slate-200/40 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-white/80 hover:shadow-xl hover:shadow-blue-500/10"
					style="margin-left: 2rem;"
				>
					<div class="flex items-center gap-5">
						<div
							class="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
						>
							<Briefcase size={28} />
						</div>
						<div>
							<div
								class="text-lg font-extrabold text-slate-900 group-hover:text-blue-500 transition-colors"
							>
								项目
							</div>
							<div class="mt-1 text-sm font-medium text-slate-500">
								精选展示 {projects.length} 个
							</div>
						</div>
					</div>
					<div
						class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-all group-hover:bg-blue-500 group-hover:text-white"
					>
						<ArrowRight size={18} />
					</div>
				</a>

				<!-- 资源卡片 -->
				<a
					href={resolve('/resources')}
					in:fly={{ x: 50, duration: 800, delay: 700 }}
					class="group relative flex items-center justify-between rounded-3xl border border-white/60 bg-white/60 p-5 shadow-lg shadow-slate-200/40 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-white/80 hover:shadow-xl hover:shadow-orange-500/10"
					style="margin-left: 4rem;"
				>
					<div class="flex items-center gap-5">
						<div
							class="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
						>
							<Compass size={28} />
						</div>
						<div>
							<div
								class="text-lg font-extrabold text-slate-900 group-hover:text-orange-500 transition-colors"
							>
								资源
							</div>
							<div class="mt-1 text-sm font-medium text-slate-500">整理链接与工具清单</div>
						</div>
					</div>
					<div
						class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-all group-hover:bg-orange-500 group-hover:text-white"
					>
						<ArrowRight size={18} />
					</div>
				</a>
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
						{#each recentPosts as post, i (post.slug)}
							<Reveal delay={i * 100} y={20}>
								<ArticleCard article={post} imageAspect="aspect-[2/1]" />
							</Reveal>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>

			<!-- 3D 悬浮卡片 -->
			<TiltCard
				class="rounded-3xl border-slate-200/80 bg-gradient-to-br from-slate-50 to-blue-50/50 p-8 shadow-xl shadow-slate-100/50 hover:shadow-2xl hover:shadow-blue-100/50"
			>
				<div
					class="absolute -top-14 -right-14 h-48 w-48 rounded-full bg-blue-100/50 blur-3xl"
					style="transform: translateZ(20px)"
				></div>
				<Card.Header class="p-0">
					<Card.Title
						class="mb-8 text-xl font-extrabold text-slate-900"
						style="transform: translateZ(30px)">精选项目</Card.Title
					>
				</Card.Header>
				<Card.Content class="flex-grow space-y-6 p-0" style="transform: translateZ(20px)">
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
				<Card.Footer class="p-0" style="transform: translateZ(30px)">
					<Button
						href="/projects"
						size="sm"
						class="mt-8 self-start gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
					>
						<span>查看项目库</span>
						<ArrowRight size={16} />
					</Button>
				</Card.Footer>
			</TiltCard>
		</section>

		<section class="mt-14 sm:mt-18">
			<div class="mb-8 flex items-center gap-3">
				<div class="h-8 w-1 rounded-full bg-brand"></div>
				<h2 class="text-xl font-extrabold text-slate-900">本站研发技术栈</h2>
				<span class="text-sm font-medium text-slate-500">现代全栈开发工具集</span>
			</div>

			<div
				class="group/spotlight grid grid-cols-3 gap-2 sm:gap-4 lg:grid-cols-6 relative"
				role="group"
				onmousemove={(e) => {
					const rect = e.currentTarget.getBoundingClientRect();
					const x = e.clientX - rect.left;
					const y = e.clientY - rect.top;
					e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
					e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
				}}
			>
				{#each techStack as tech, i (tech.name)}
					<Reveal delay={i * 100} x={-20} y={0} duration={500}>
						<Card.Root
							class="group relative flex aspect-square h-auto w-full max-w-[6.2rem] flex-col justify-between overflow-hidden rounded-xl border {tech.border} bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:max-w-none sm:rounded-2xl mx-auto"
						>
							<div
								class="absolute inset-0 {tech.bg} opacity-0 transition-opacity duration-300 group-hover:opacity-100"
							></div>

							<!-- 顶部装饰光斑 -->
							<div
								class="absolute -right-8 -top-8 h-24 w-24 rounded-full {tech.bg} blur-2xl opacity-40 transition-all duration-500 group-hover:scale-150 group-hover:opacity-60"
							></div>

							<!-- 水印图标装饰 -->
							<div
								class="absolute -bottom-8 -right-8 text-slate-900 opacity-[0.04] transition-all duration-500 group-hover:-translate-y-2 group-hover:translate-x-2 group-hover:scale-110 group-hover:opacity-[0.08]"
							>
								<tech.icon size={120} />
							</div>

							<Card.Content class="relative flex h-full flex-col justify-between p-3 sm:p-4">
								<div
									class="w-fit rounded-xl bg-slate-50 p-2 {tech.color} ring-1 ring-slate-100 transition-colors duration-300 group-hover:bg-white group-hover:ring-white/50 sm:p-2.5"
								>
									<tech.icon size={24} class="sm:h-[30px] sm:w-[30px]" />
								</div>
								<div>
									<div class="text-xs font-bold text-slate-900 sm:text-sm">{tech.name}</div>
									<div class="hidden mt-1 text-xs font-medium text-slate-500 sm:block">
										{tech.desc}
									</div>
								</div>
							</Card.Content>
						</Card.Root>
					</Reveal>
				{/each}
			</div>
		</section>
	</div>
{/if}
