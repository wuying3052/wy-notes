<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight } from 'lucide-svelte';

	interface Props {
		project: {
			title: string;
			desc: string;
			image: string;
			url: string;
			year: string;
			tags: string[];
		};
	}

	let { project }: Props = $props();
</script>

<article
	class="group relative flex flex-col h-full bg-white rounded-[2rem] overflow-hidden border border-slate-100/80 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2 transition-all duration-500 ease-out"
>
	<!-- 图片容器: 自带微妙的叠加层 -->
	<a href={resolve(project.url)} class="block relative aspect-[16/11] overflow-hidden">
		<img
			src={project.image}
			alt={project.title}
			class="w-full h-full object-cover transform scale-[1.01] group-hover:scale-110 transition-transform duration-1000 ease-out bg-slate-100"
		/>
		<div
			class="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
		></div>

		<!-- 年份标签 (悬浮显示) -->
		<div
			class="absolute top-4 left-4 transform -translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100"
		>
			<span
				class="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold text-slate-900 uppercase tracking-tighter shadow-sm"
			>
				{project.year}
			</span>
		</div>
	</a>

	<div class="flex-1 p-8 md:p-10 flex flex-col">
		<!-- 标签 -->
		<div class="flex flex-wrap gap-2 mb-4">
			{#each project.tags.slice(0, 2) as tag}
				<span
					class="text-[10px] font-bold text-brand uppercase tracking-widest bg-brand/5 px-2 py-0.5 rounded"
				>
					{tag}
				</span>
			{/each}
		</div>

		<h3
			class="text-2xl font-bold text-slate-900 mb-4 group-hover:text-brand transition-colors leading-tight"
		>
			<a href={resolve(project.url)} class="focus:outline-none">
				<span class="absolute inset-0 size-full"></span>
				{project.title}
			</a>
		</h3>

		<p class="text-slate-500 line-clamp-3 mb-8 flex-1 leading-relaxed text-[15px]">
			{project.desc}
		</p>

		<div class="flex items-center text-sm font-bold text-slate-900 mt-auto group/link">
			<span class="mr-2">查看详情</span>
			<div
				class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand group-hover:text-white group-hover:translate-x-1 transition-all duration-500"
			>
				<ArrowRight size={18} />
			</div>
		</div>
	</div>
</article>
