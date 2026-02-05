<script lang="ts">
	import { page } from '$app/state';
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
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{SITE_CONFIG.title}</title>

	<!-- Primary Meta Tags -->
	<meta name="title" content={SITE_CONFIG.title} />
	<meta name="description" content={SITE_CONFIG.description} />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content={`${SITE_CONFIG.url}${page.url.pathname}`} />
	<meta property="og:title" content={SITE_CONFIG.title} />
	<meta property="og:description" content={SITE_CONFIG.description} />
	<meta property="og:image" content={SITE_CONFIG.ogImage} />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content={`${SITE_CONFIG.url}${page.url.pathname}`} />
	<meta property="twitter:title" content={SITE_CONFIG.title} />
	<meta property="twitter:description" content={SITE_CONFIG.description} />
	<meta property="twitter:image" content={SITE_CONFIG.ogImage} />
</svelte:head>

<div class="min-h-screen flex flex-col relative animated-bg">
	<!-- 微信分享图片兜底 -->
	<div style="display:none;">
		<img src={SITE_CONFIG.ogImage} alt="Preview" />
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
