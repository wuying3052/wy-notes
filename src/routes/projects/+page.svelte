<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight, Sparkles, Filter, Globe, Github } from 'lucide-svelte';
	import ProjectGridItem from '$lib/components/projects/ProjectGridItem.svelte';
	import { onMount } from 'svelte';

	let { data } = $props();
	let { projects } = $derived(data);

	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});
</script>

<div class="relative min-h-screen pb-32">
	<!-- 背景装饰: 彩色柔焦光晕 -->
	<div class="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
		<div
			class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/5 blur-[120px] rounded-full animate-pulse"
		></div>
		<div
			class="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full delay-700"
		></div>
	</div>

	<div class="max-w-7xl mx-auto px-6 relative z-10">
		<!-- 1. Hero 区域 (紧凑型) -->
		<header class="pt-16 pb-16 md:pt-24 md:pb-20">
			<div
				class="flex items-center space-x-3 text-brand font-bold uppercase tracking-[0.2em] text-[10px] mb-6 overflow-hidden"
			>
				<div class="h-px w-8 bg-brand"></div>
				<span
					class="transform transition-transform duration-700 {mounted
						? 'translate-y-0'
						: 'translate-y-full'}"
				>
					精品数字作品展示
				</span>
			</div>

			<h1 class="text-6xl md:text-8xl font-black text-slate-900 mb-8 tracking-tighter leading-none">
				构建<span class="text-transparent bg-clip-text bg-gradient-to-r from-brand to-blue-500"
					>有生命力</span
				>的数字体验。
			</h1>

			<p class="text-xl md:text-2xl text-slate-500 max-w-3xl leading-relaxed font-medium">
				在这里，我们探索技术与美学的边界，通过每一个像素传递价值和创意。
			</p>
		</header>

		<!-- 2. 内容列表 (全员大卡片风格) -->
		<div class="space-y-24 md:space-y-32">
			{#if projects.length > 0}
				{#each projects as project, i (project.url)}
					<section
						class="h-full transform transition-all duration-1000 {mounted
							? 'translate-y-0 opacity-100'
							: 'translate-y-12 opacity-0'}"
						style="transition-delay: {i * 150}ms"
					>
						<article class="group relative transition-all duration-700">
							<a href={resolve(project.url)} class="absolute inset-0 z-10 block">
								<span class="sr-only">查看 {project.title}</span>
							</a>

							<div class="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-24 items-center">
								<!-- 图片展示 (奇数行反转位置) -->
								<div class="lg:col-span-7 relative {i % 2 === 1 ? 'lg:order-last' : ''}">
									<div
										class="block relative aspect-[16/10] rounded-[2.5rem] overflow-hidden shadow-2xl transition-transform duration-700 group-hover:scale-[0.98]"
									>
										<img
											src={project.image}
											alt={project.title}
											class="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out"
										/>
									</div>
								</div>

								<!-- 文本描述 -->
								<div
									class="lg:col-span-5 px-4 md:px-0 py-4 lg:py-0 space-y-6 md:space-y-8 relative"
								>
									<!-- 悬浮提示 (文本对角线，极简风格) -->
									<div
										class="absolute -top-8 right-0 z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0 pointer-events-none flex items-center gap-2 text-slate-400 text-xs font-bold tracking-widest uppercase"
									>
										<span>查看详情</span>
										<ArrowRight size={14} />
									</div>

									<div
										class="flex items-center gap-4 text-slate-400 font-mono text-[10px] font-bold tracking-[0.2em] uppercase"
									>
										<span>{project.year}</span>
									</div>

									<h2
										class="text-4xl md:text-5xl font-black text-slate-900 leading-tight group-hover:text-brand transition-colors duration-500 tracking-tighter"
									>
										{project.title}
									</h2>

									<p class="text-base md:text-lg text-slate-500 leading-relaxed max-w-md">
										{project.desc}
									</p>

									<div class="flex flex-wrap gap-2">
										{#each project.tags as tag}
											<span
												class="px-4 py-1.5 rounded-full bg-white border border-slate-100 text-slate-500 text-[11px] font-bold shadow-sm"
											>
												{tag}
											</span>
										{/each}
									</div>

									<div class="pt-6 flex flex-wrap items-center gap-4 relative z-20">
										<!-- 链接按钮 (需设置 z-20 以便在覆盖层之上点击) -->
										{#if project.demoUrl}
											<a
												href={project.demoUrl}
												target="_blank"
												rel="noopener noreferrer"
												class="w-12 h-12 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:text-brand hover:border-brand hover:bg-brand/5 transition-all"
												title="在线演示"
											>
												<Globe size={20} />
											</a>
										{/if}
										{#if project.repoUrl}
											<a
												href={project.repoUrl}
												target="_blank"
												rel="noopener noreferrer"
												class="w-12 h-12 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-900 hover:bg-slate-50 transition-all"
												title="查看代码"
											>
												<Github size={20} />
											</a>
										{/if}
									</div>

									<!-- 作者信息 -->
									{#if project.author}
										<div class="flex items-center gap-3 pt-2">
											<img
												src={project.author.avatar}
												alt={project.author.name}
												class="w-8 h-8 rounded-full bg-slate-100 object-cover ring-2 ring-white shadow-sm"
											/>
											<span class="text-xs font-bold text-slate-900">
												{project.author.name}
											</span>
										</div>
									{/if}
								</div>
							</div>

							<!-- 背景装饰字符 (基于每个项目，随布局交替位置) -->
							<span
								class="absolute -top-12 {i % 2 === 0
									? '-right-12'
									: '-left-12'} text-[20rem] font-black text-slate-900/[0.015] leading-none select-none pointer-events-none group-hover:text-brand/[0.04] transition-colors duration-1000 uppercase"
							>
								{project.title.charAt(0)}
							</span>
						</article>
					</section>
				{/each}
			{:else}
				<div class="py-20 text-center">
					<p class="text-slate-400 font-medium">暂无项目展示，敬请期待。</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	:global(body) {
		background-color: #ffffff;
	}
</style>
