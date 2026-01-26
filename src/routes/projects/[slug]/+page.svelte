<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowLeft, Github, Layers, Calendar, ExternalLink } from 'lucide-svelte';

	interface Props {
		data: {
			project: {
				title: string;
				image: string;
				desc: string;
				demoUrl: string;
				repoUrl: string;
				year: string;
				tags: string[];
				contentHtml: string;
				tocItems: {
					id: string;
					text: string;
					depth: number;
				}[];
			};
		};
	}

	let { data }: Props = $props();

	let project = $derived(data.project);

	let tocItems = $derived(project.tocItems || []);
</script>

<svelte:head>
	<title>{project.title} | WY NOTES</title>
	<meta name="description" content={project.desc} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={project.title} />
	<meta property="og:description" content={project.desc} />
	<meta property="og:image" content={project.image} />
	<meta property="twitter:card" content="summary_large_image" />
</svelte:head>

<div class="min-h-screen pb-0 bg-white">
	<header class="h-[60vh] md:h-[70vh] w-full relative overflow-hidden group">
		<div class="absolute inset-0 bg-slate-900/40 z-10"></div>
		<img
			src={project.image}
			alt={project.title}
			class="w-full h-full object-cover transform scale-105 group-hover:scale-100 transition-transform duration-1000"
		/>

		<div
			class="absolute top-0 left-0 right-0 z-30 p-6 md:p-8 flex justify-between items-start bg-gradient-to-b from-black/50 to-transparent"
		>
			<a
				href={resolve('/projects')}
				class="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md text-white px-5 py-2.5 rounded-full hover:bg-white/20 transition-all border border-white/10 hover:pr-6"
			>
				<ArrowLeft size={18} />
				<span class="font-medium text-sm">返回项目列表</span>
			</a>
		</div>

		<div
			class="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-slate-900/90 to-transparent pt-32 pb-12 px-4"
		>
			<div class="max-w-7xl mx-auto w-full">
				<h1 class="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight max-w-4xl">
					{project.title}
				</h1>
				<div class="flex flex-col md:flex-row gap-6 md:items-end justify-between">
					<div class="space-y-6">
						<!-- 年份与技术栈 -->
						<div class="flex flex-wrap items-center gap-4 text-white/90">
							<div
								class="flex items-center space-x-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10"
							>
								<Calendar size={16} />
								<span class="font-mono text-sm">{project.year}</span>
							</div>
							<div class="h-4 w-px bg-white/20 hidden md:block"></div>
							<div class="flex flex-wrap gap-2">
								{#each project.tags as tag (tag)}
									<span
										class="px-2.5 py-1 bg-black/30 backdrop-blur-md text-white/90 border border-white/10 rounded-lg text-xs font-medium"
									>
										{tag}
									</span>
								{/each}
							</div>
						</div>

						<!-- 操作按钮 -->
						<div class="flex flex-wrap gap-4 pt-2">
							{#if project.demoUrl}
								<a
									href={project.demoUrl}
									target="_blank"
									rel="external noopener noreferrer"
									class="px-6 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-all shadow-lg hover:-translate-y-0.5 flex items-center space-x-2 text-sm"
								>
									<span>访问线上版本</span>
									<ExternalLink size={18} />
								</a>
							{/if}
							{#if project.repoUrl}
								<button
									type="button"
									onclick={() => window.open(project.repoUrl, '_blank', 'noopener,noreferrer')}
									class="px-6 py-3 bg-black/40 backdrop-blur-md text-white border border-white/20 font-bold rounded-xl hover:bg-black/60 transition-all flex items-center space-x-2 text-sm"
								>
									<Github size={18} />
									<span>查看源代码</span>
								</button>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</header>

	<main class="max-w-6xl mx-auto px-6 py-12 md:py-20 relative z-20">
		<p class="text-xl text-slate-600 leading-relaxed mb-16 font-light">
			{project.desc}
		</p>

		<div class="prose prose-slate max-w-none">
			{@html project.contentHtml}
		</div>
	</main>
</div>

<style>
	/* 修复 Markdown 中 Badge 图片的垂直排列问题 */
	:global(.prose p[align='center']) {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 2rem;
		margin-bottom: 2rem;
	}

	:global(.prose p[align='center'] img) {
		display: inline-block;
		margin: 0;
	}
</style>
