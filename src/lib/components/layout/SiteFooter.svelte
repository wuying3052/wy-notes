<script lang="ts">
	import { resolve } from '$app/paths';
	import BrandIcon from '$lib/components/ui/BrandIcon.svelte';
	import { siteNavItems } from '$lib/site/nav';

	let { logoSrc, siteName } = $props<{
		logoSrc: string;
		siteName: string;
	}>();

	const year = new Date().getFullYear();
</script>

<footer class="glass mt-6 border-t border-slate-100">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
		<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
			<div class="flex items-center gap-4">
				<a
					href={resolve('/')}
					class="inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand/30 rounded-lg"
				>
					<img src={logoSrc} alt={siteName} class="h-6 w-auto" />
					<span class="text-sm font-bold tracking-tight text-slate-900">{siteName}</span>
				</a>
				<div class="hidden sm:flex items-center gap-3 text-xs text-slate-400">
					<span class="h-1 w-1 rounded-full bg-slate-200"></span>
					<span>© {year}</span>
					<span class="h-1 w-1 rounded-full bg-slate-200"></span>
					<span>基于 SvelteKit 构建</span>
				</div>
			</div>

			<div class="flex items-center gap-6">
				<nav class="flex items-center gap-5">
					{#each siteNavItems as item (item.href)}
						<a
							href={resolve(item.href)}
							class="text-xs font-medium text-slate-500 hover:text-brand transition-colors"
						>
							{item.name}
						</a>
					{/each}
				</nav>

				<div class="h-3 w-px bg-slate-200 hidden sm:block"></div>

				<a
					href="https://github.com"
					target="_blank"
					rel="noreferrer"
					class="text-slate-400 hover:text-brand transition-colors p-1"
					title="GitHub"
				>
					<BrandIcon name="github" size={16} />
				</a>
			</div>
		</div>

		<div
			class="mt-4 flex sm:hidden items-center justify-center gap-3 text-[10px] text-slate-400 border-t border-slate-50 pt-3"
		>
			<span>© {year} {siteName}</span>
			<span>•</span>
			<span>Built with SvelteKit</span>
		</div>
	</div>
</footer>
