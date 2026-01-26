<script lang="ts">
	import { page } from '$app/stores';
	import favicon from '$lib/assets/svg/logo.svg';
	import wyNotesLogo from '$lib/assets/image/wy-notes-logo.webp';
	import SiteHeader from '$lib/components/layout/SiteHeader.svelte';
	import SiteFooter from '$lib/components/layout/SiteFooter.svelte';
	import AppToaster from '$lib/components/feedback/AppToaster.svelte';
	import ConfirmDialog from '$lib/components/feedback/ConfirmDialog.svelte';
	import '../app.css';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();

	let isHideLayout = $derived(
		$page.url.pathname.startsWith('/admin') || $page.url.pathname === '/login'
	);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>WY NOTES</title>
</svelte:head>

<div class="min-h-screen flex flex-col aurora-bg relative">
	<AppToaster />
	<ConfirmDialog />
	{#if !isHideLayout}
		<SiteHeader logoSrc={wyNotesLogo} siteName="WY NOTES" user={data.user} profile={data.profile} />

		<main class="flex-grow pt-16">
			{@render children()}
		</main>

		<SiteFooter logoSrc={wyNotesLogo} siteName="WY NOTES" />
	{:else}
		{@render children()}
	{/if}
</div>
