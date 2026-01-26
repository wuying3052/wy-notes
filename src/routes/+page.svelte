<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight, Sparkles, BookText, Briefcase, Compass } from 'lucide-svelte';
	import { techStack } from '$lib/site/tech-stack';

	let { data } = $props();
	let { recentPosts, projects } = $derived(data);
</script>

<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
	<section class="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
		<div class="space-y-7">
			<div
				class="inline-flex items-center gap-2 rounded-full bg-brand/10 text-brand text-xs font-bold px-3 py-1 border border-brand/20"
			>
				<span class="h-1.5 w-1.5 rounded-full bg-brand"></span>
				<span>持续更新 · 结构化沉淀</span>
			</div>

			<h1
				class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.05]"
			>
				让知识更可检索，让实践更可复用
			</h1>

			<p class="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
				这里收录文章、项目与资源，以清晰的信息结构组织内容，便于快速浏览与回溯。
			</p>

			<div class="flex flex-col sm:flex-row sm:items-center gap-3">
				<a
					href={resolve('/articles')}
					class="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 bg-slate-900 text-white text-sm font-extrabold hover:bg-slate-800 transition-colors shadow-xl shadow-slate-900/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
				>
					<span>浏览文章</span>
					<ArrowRight size={18} />
				</a>
				<a
					href={resolve('/projects')}
					class="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 bg-white/70 text-slate-900 text-sm font-extrabold border border-white/60 hover:bg-white/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
				>
					<span>查看项目</span>
					<ArrowRight size={18} />
				</a>
			</div>
		</div>

		<div class="hidden lg:block">
			<div class="relative h-[420px]">
				<div
					class="absolute inset-0 rounded-[2.5rem] bg-white/70 border border-white/60 shadow-2xl"
				></div>
				<div class="absolute left-8 top-8 right-8 grid grid-cols-1 gap-4">
					<div class="glass rounded-2xl p-5 border border-white/60">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<div
									class="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center"
								>
									<BookText size={18} />
								</div>
								<div>
									<div class="text-sm font-extrabold text-slate-900">文章</div>
									<div class="text-xs text-slate-500">近期更新 {recentPosts.length} 篇</div>
								</div>
							</div>
							<a
								href={resolve('/articles')}
								class="text-xs font-bold text-slate-600 hover:text-slate-900">进入</a
							>
						</div>
					</div>

					<div class="glass rounded-2xl p-5 border border-white/60">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<div
									class="h-10 w-10 rounded-2xl bg-white/80 border border-white/70 text-slate-900 flex items-center justify-center"
								>
									<Briefcase size={18} />
								</div>
								<div>
									<div class="text-sm font-extrabold text-slate-900">项目</div>
									<div class="text-xs text-slate-500">精选展示 {projects.length} 个</div>
								</div>
							</div>
							<a
								href={resolve('/projects')}
								class="text-xs font-bold text-slate-600 hover:text-slate-900">进入</a
							>
						</div>
					</div>

					<div class="glass rounded-2xl p-5 border border-white/60">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<div
									class="h-10 w-10 rounded-2xl bg-brand/10 border border-brand/20 text-brand flex items-center justify-center"
								>
									<Compass size={18} />
								</div>
								<div>
									<div class="text-sm font-extrabold text-slate-900">资源</div>
									<div class="text-xs text-slate-500">整理链接与工具清单</div>
								</div>
							</div>
							<a
								href={resolve('/resources')}
								class="text-xs font-bold text-slate-600 hover:text-slate-900">进入</a
							>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section class="mt-14 sm:mt-18 grid grid-cols-1 lg:grid-cols-3 gap-6">
		<div class="glass rounded-3xl p-7 border border-white/60 lg:col-span-2">
			<div class="flex items-center justify-between gap-4 mb-6">
				<h2 class="text-lg font-extrabold text-slate-900 flex items-center gap-2">
					<Sparkles class="text-brand" size={18} />
					<span>最新文章</span>
				</h2>
				<a
					href={resolve('/articles')}
					class="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
				>
					查看全部
				</a>
			</div>

			<div class="divide-y divide-slate-200/60">
				{#each recentPosts as post (post.slug)}
					<a href={resolve(`/articles/${post.slug}`)} class="block py-4 group">
						<div class="flex items-start justify-between gap-4">
							<div class="min-w-0">
								<div class="flex items-center gap-2">
									<h3
										class="text-base font-extrabold text-slate-900 group-hover:text-brand transition-colors truncate"
									>
										{post.title}
									</h3>
									<span
										class="shrink-0 text-[11px] font-mono text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full"
									>
										{post.tag}
									</span>
								</div>
								<p
									class="text-sm text-slate-600 mt-1 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]"
								>
									{post.desc}
								</p>
							</div>
							<div class="shrink-0 text-xs font-bold text-slate-400">{post.date}</div>
						</div>
					</a>
				{/each}
			</div>
		</div>

		<div
			class="rounded-3xl p-7 border border-slate-800 bg-slate-900 text-white overflow-hidden relative shadow-2xl"
		>
			<div class="absolute -top-14 -right-14 h-48 w-48 rounded-full bg-white/10 blur-3xl"></div>
			<h2 class="text-lg font-extrabold mb-6">精选项目</h2>
			<div class="space-y-4">
				{#each projects as project (project.name)}
					<div class="flex items-start gap-3">
						<div class="mt-1 h-2.5 w-2.5 rounded-full {project.color}"></div>
						<div class="min-w-0">
							<div class="text-sm font-bold text-white/90 truncate">{project.name}</div>
							{#if project.desc}
								<div
									class="text-xs text-white/60 mt-1 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]"
								>
									{project.desc}
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
			<a
				href={resolve('/projects')}
				class="mt-8 inline-flex items-center gap-2 rounded-2xl px-4 py-2 bg-white/10 hover:bg-white/15 transition-colors text-xs font-extrabold"
			>
				<span>查看项目库</span>
				<ArrowRight size={16} />
			</a>
		</div>
	</section>

	<section class="mt-14 sm:mt-18">
		<div class="flex items-center gap-3 mb-8">
			<div class="h-8 w-1 bg-brand rounded-full"></div>
			<h2 class="text-xl font-extrabold text-slate-900">本站研发技术栈</h2>
			<span class="text-sm text-slate-500 font-medium">现代全栈开发工具集</span>
		</div>

		<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
			{#each techStack as tech (tech.name)}
				<div
					class="group relative overflow-hidden rounded-2xl border {tech.border} bg-white p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
				>
					<div
						class="absolute inset-0 {tech.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300"
					></div>
					<div class="relative flex flex-col items-start gap-3">
						<div class="p-2.5 rounded-xl {tech.bg} {tech.color}">
							<tech.icon size={20} />
						</div>
						<div>
							<div class="font-bold text-slate-900 text-sm">{tech.name}</div>
							<div class="text-xs text-slate-500 mt-0.5">{tech.desc}</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</section>
</div>
