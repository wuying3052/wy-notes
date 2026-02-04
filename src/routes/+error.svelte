<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { Home, BookOpen, RotateCw, ArrowLeft } from 'lucide-svelte';
	import wyNotesLogo from '$lib/assets/image/wy-notes-logo.webp';

	let status = $derived($page.status);
	let error = $derived($page.error);

	let isNotFound = $derived(status === 404);
	let isServerError = $derived(status >= 500);

	let title = $derived(isNotFound ? '页面未找到' : '系统错误');
	let message = $derived(
		isNotFound
			? '抱歉，您访问的页面可能已被移除、更名或暂时不可用。'
			: error?.message || '发生了一些意外问题，请稍后再试。'
	);
</script>

<svelte:head>
	<title>{status} - {title} | WY NOTES</title>
</svelte:head>

<div
	class="relative flex min-h-[calc(100vh-80px)] w-full items-center justify-center overflow-hidden p-6"
>
	<!-- 背景装饰 -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div
			class="absolute -top-[20%] -right-[10%] h-[600px] w-[600px] rounded-full bg-brand/5 blur-[120px]"
		></div>
		<div
			class="absolute -bottom-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[120px]"
		></div>
	</div>

	<div class="relative w-full max-w-2xl">
		<!-- 移除卡片容器样式，保持内容 -->
		<div class="relative z-10 flex flex-col items-center text-center">
			<!-- 状态码背景水印 -->
			<div
				class="absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 select-none text-[12rem] font-black leading-none text-slate-900/[0.03] md:text-[18rem]"
			>
				{status}
			</div>

			<!-- 图标区域 -->
			<div class="mb-8">
				<div
					class="flex h-24 w-24 items-center justify-center rounded-[2rem] border-4 border-white shadow-xl md:h-32 md:w-32 bg-white"
				>
					<img
						src={wyNotesLogo}
						alt="WY Notes Logo"
						class="h-16 w-16 object-contain md:h-20 md:w-20"
					/>
				</div>
			</div>

			<!-- 文本区域 -->
			<div
				class="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/50 px-3 py-1 backdrop-blur-sm"
			>
				<span class="flex h-2 w-2 relative">
					<span
						class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 {isNotFound
							? 'bg-blue-500'
							: 'bg-rose-500'}"
					></span>
					<span
						class="relative inline-flex rounded-full h-2 w-2 {isNotFound
							? 'bg-blue-500'
							: 'bg-rose-500'}"
					></span>
				</span>
				<span class="text-xs font-bold font-mono text-slate-500">{status} Error</span>
			</div>

			<h1 class="mb-4 mt-6 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
				{title}
			</h1>

			<p class="mb-10 max-w-md text-base leading-relaxed text-slate-500 md:text-lg">
				{message}
			</p>

			<!-- 操作按钮 -->
			<div class="flex flex-col w-full gap-3 sm:flex-row sm:w-auto sm:justify-center">
				<Button
					href="/"
					size="lg"
					class="w-full gap-2 rounded-2xl px-8 sm:w-auto shadow-xl shadow-brand/10 hover:-translate-y-0.5 transition-all"
				>
					<Home size={18} />
					<span>返回首页</span>
				</Button>

				<Button
					href="/articles"
					variant="outline"
					size="lg"
					class="w-full gap-2 rounded-2xl bg-white/80 px-8 sm:w-auto hover:-translate-y-0.5 transition-all"
				>
					<BookOpen size={18} />
					<span>浏览文章</span>
				</Button>

				{#if isServerError}
					<Button
						variant="ghost"
						size="lg"
						class="w-full gap-2 rounded-2xl px-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 sm:w-auto"
						onclick={() => location.reload()}
					>
						<RotateCw size={18} />
						<span>重试</span>
					</Button>
				{/if}
			</div>
		</div>

		<div class="mt-12 text-center">
			<button
				onclick={() => history.back()}
				class="group inline-flex items-center gap-1 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
			>
				<ArrowLeft size={16} class="transition-transform group-hover:-translate-x-1" />
				<span>返回上一页</span>
			</button>
		</div>
	</div>
</div>
