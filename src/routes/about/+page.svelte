<script lang="ts">
	import { resolve } from '$app/paths';
	import { Github, Sparkles, BookText, Briefcase, Compass } from 'lucide-svelte';
</script>

<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
	<div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
		<div>
			<div
				class="inline-flex items-center gap-2 rounded-full bg-brand/10 text-brand text-xs font-bold px-3 py-1 border border-brand/20"
			>
				<Sparkles size={14} />
				<span>关于本站</span>
			</div>
			<h1 class="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
				WY Notes
			</h1>
			<p class="mt-2 text-base sm:text-lg text-slate-600 max-w-2xl">
				一个用于归档文章、项目与资源的极简站点：优先信息结构、统一交互与可访问性。
			</p>
		</div>
		<a
			href="https://github.com"
			target="_blank"
			rel="noreferrer"
			class="inline-flex items-center gap-2 rounded-2xl px-5 py-3 bg-slate-900 text-white text-sm font-extrabold hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
		>
			<Github size={18} />
			<span>GitHub</span>
		</a>
	</div>

	<div class="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
		<div class="glass rounded-3xl p-7 border border-white/60 lg:col-span-2">
			<h2 class="text-lg font-extrabold text-slate-900">内容结构</h2>
			<p class="mt-2 text-sm text-slate-600">
				首页强调入口与可扫读的层级；正文页聚焦内容本身；顶部与底部保持全站一致的导航与对齐。
			</p>
			<div class="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
				<a
					href={resolve('/articles')}
					class="glass rounded-2xl p-5 border border-white/60 hover:bg-white/80 transition-colors"
				>
					<div
						class="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center"
					>
						<BookText size={18} />
					</div>
					<div class="mt-3 text-sm font-extrabold text-slate-900">文章</div>
					<div class="mt-1 text-xs text-slate-600">技术记录与方法论沉淀</div>
				</a>
				<a
					href={resolve('/projects')}
					class="glass rounded-2xl p-5 border border-white/60 hover:bg-white/80 transition-colors"
				>
					<div
						class="h-10 w-10 rounded-2xl bg-white/80 border border-white/70 text-slate-900 flex items-center justify-center"
					>
						<Briefcase size={18} />
					</div>
					<div class="mt-3 text-sm font-extrabold text-slate-900">项目</div>
					<div class="mt-1 text-xs text-slate-600">案例、复盘与关键决策</div>
				</a>
				<a
					href={resolve('/resources')}
					class="glass rounded-2xl p-5 border border-white/60 hover:bg-white/80 transition-colors"
				>
					<div
						class="h-10 w-10 rounded-2xl bg-brand/10 border border-brand/20 text-brand flex items-center justify-center"
					>
						<Compass size={18} />
					</div>
					<div class="mt-3 text-sm font-extrabold text-slate-900">资源</div>
					<div class="mt-1 text-xs text-slate-600">工具、链接与清单整理</div>
				</a>
			</div>
		</div>

		<div class="glass rounded-3xl p-7 border border-white/60">
			<h2 class="text-lg font-extrabold text-slate-900">技术栈</h2>
			<div class="mt-4 flex flex-wrap gap-2">
				{#each ['SvelteKit', 'Svelte 5', 'TailwindCSS 4', 'bits-ui', 'Supabase'] as item (item)}
					<span
						class="px-3 py-1 rounded-lg bg-white/70 border border-white/60 text-xs font-bold text-slate-700"
					>
						{item}
					</span>
				{/each}
			</div>
			<p class="mt-4 text-sm text-slate-600">保持轻量与可维护：组件化、统一间距与可访问性策略。</p>
		</div>
	</div>
</div>
