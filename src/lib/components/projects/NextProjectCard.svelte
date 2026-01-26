<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight } from 'lucide-svelte';

	let {
		project
	}: {
		project: { title: string; desc?: string; image: string; url: string } | null;
	} = $props();
</script>

{#if project}
	<section class="border-t border-slate-200 mt-20 pt-20">
		<div class="container mx-auto px-4 max-w-5xl">
			<div
				class="flex items-center space-x-2 text-brand font-bold uppercase tracking-widest text-sm mb-8"
			>
				<span>下一个项目</span>
				<ArrowRight size={16} />
			</div>

			<a
				href={resolve(project.url)}
				class="group relative block rounded-3xl overflow-hidden aspect-[21/9] md:aspect-[3/1]"
			>
				<img
					src={project.image}
					alt={project.title}
					class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
				/>

				<div
					class="absolute inset-0 bg-slate-900/60 group-hover:bg-slate-900/50 transition-colors duration-500"
				></div>

				<div
					class="absolute inset-0 p-8 md:p-16 flex flex-col justify-center items-center text-center"
				>
					<h3
						class="text-3xl md:text-5xl font-bold text-white mb-4 group-hover:translate-y-[-4px] transition-transform"
					>
						{project.title}
					</h3>
					{#if project.desc}
						<p
							class="text-white/80 max-w-xl text-lg opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100 hidden md:block"
						>
							{project.desc}
						</p>
					{/if}

					<div
						class="mt-8 bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-2 rounded-full font-bold text-sm uppercase tracking-widest opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-200"
					>
						阅读案例研究
					</div>
				</div>
			</a>
		</div>
	</section>
{/if}
