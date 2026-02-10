<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import mermaid from 'mermaid';
	import { SITE_CONFIG } from '$lib/config/site';
	import favicon from '$lib/assets/svg/logo.svg';
	import wyNotesLogo from '$lib/assets/image/wy-notes-logo.webp';
	import SiteHeader from '$lib/components/layout/SiteHeader.svelte';
	import SiteFooter from '$lib/components/layout/SiteFooter.svelte';
	import ReadingProgress from '$lib/components/ui/ReadingProgress.svelte';
	import BackToTop from '$lib/components/ui/BackToTop.svelte';
	import '../app.css';

	let { children } = $props();
	let showLayout = $derived(page.status < 400);

	onMount(() => {
		mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
	});

	afterNavigate(() => {
		// 这里的 setTimeout 是为了等待 DOM 更新完成
		setTimeout(async () => {
			// 1. 还原 Mermaid 代码
			const mermaidDivs = document.querySelectorAll('.mermaid[data-code]');
			mermaidDivs.forEach((div) => {
				const code = div.getAttribute('data-code');
				if (code) {
					div.textContent = decodeURIComponent(code);
					div.removeAttribute('data-code'); // 避免重复处理
				}
			});

			// 2. 只有当存在 mermaid 节点时才运行，避免报错
			if (document.querySelector('.mermaid')) {
				await mermaid.run({
					querySelector: '.mermaid'
				});
			}
		}, 100);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{SITE_CONFIG.title}</title>
	<meta name="robots" content="index,follow,max-image-preview:large" />
	<meta property="og:site_name" content={SITE_CONFIG.name} />
	<meta property="og:locale" content={SITE_CONFIG.locale} />
</svelte:head>

<div class="min-h-screen flex flex-col relative animated-bg">
	<!-- 微信分享图片兜底 -->
	<div style="display:none;">
		<img src={SITE_CONFIG.ogImage} alt="Preview" itemprop="image" />
	</div>

	{#if showLayout}
		<SiteHeader logoSrc={wyNotesLogo} siteName="WY NOTES" />

		<main class="flex-grow pt-16">
			<ReadingProgress />
			{@render children()}
		</main>

		<BackToTop />
		<SiteFooter logoSrc={wyNotesLogo} siteName="WY NOTES" />
	{:else}
		{@render children()}
	{/if}
</div>
