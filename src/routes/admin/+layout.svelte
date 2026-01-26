<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import '../../app.css';

	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import AdminSidebar from '$lib/components/admin/AdminSidebar.svelte';

	let { data, children } = $props();

	let isSidebarOpen = $state(true);

	let isAdmin = $derived(Boolean(data?.isAdmin));

	let me = $derived({
		...((data as { me?: { email?: string; displayName?: string; avatarUrl?: string } } | undefined)
			?.me ?? {}),
		role: (data.role as string) ?? 'user'
	});

	function toggleSidebar() {
		isSidebarOpen = !isSidebarOpen;
		if (browser) {
			localStorage.setItem('sidebar_open', String(isSidebarOpen));
		}
	}

	onMount(() => {
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((event) => {
			if (event === 'SIGNED_OUT') {
				goto(resolve('/login'));
			}
		});

		supabase.auth.getUser().then(({ data: { user } }) => {
			if (!user && $page.url.pathname !== '/login') {
				goto(resolve('/login'));
			}
		});

		// Load sidebar preference
		if (browser) {
			const saved = localStorage.getItem('sidebar_open');
			if (saved !== null) {
				isSidebarOpen = saved === 'true';
			}
		}

		return () => {
			subscription.unsubscribe();
		};
	});

	let isAuthFreePage = $derived(
		$page.url.pathname === '/login' || $page.url.pathname === '/admin/register'
	);
</script>

<div class="min-h-screen flex aurora-bg relative bg-slate-50">
	{#if isAuthFreePage}
		<!-- 登录页 - 无侧边栏 -->
		<div class="w-full">
			{@render children()}
		</div>
	{:else}
		<!-- Sidebar -->
		<AdminSidebar isOpen={isSidebarOpen} {isAdmin} {me} onToggle={toggleSidebar} />

		<!-- Main Content Area -->
		<div
			class="flex-grow transition-all duration-300 min-h-screen flex flex-col"
			class:ml-56={isSidebarOpen}
			class:ml-20={!isSidebarOpen}
		>
			<!-- Page Content -->
			<main class="flex-grow p-6 md:p-8 overflow-x-hidden w-full">
				<div class="w-full mx-auto">
					{@render children()}
				</div>
			</main>
		</div>
	{/if}
</div>
