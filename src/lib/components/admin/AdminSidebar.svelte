<script lang="ts">
	import {
		LayoutDashboard,
		FileText,
		FolderGit2,
		Library,
		Users,
		ScrollText,
		Tag,
		PanelLeftClose,
		PanelLeftOpen,
		LogOut,
		User
	} from 'lucide-svelte';
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import wyNotesLogo from '$lib/assets/image/wy-notes-logo.webp';
	import { browser } from '$app/environment';
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';

	interface Props {
		isOpen: boolean;
		isAdmin: boolean;
		me: {
			email?: string;
			displayName?: string;
			avatarUrl?: string;
			role?: string;
		};
		onToggle: () => void;
	}

	let { isOpen, isAdmin, me, onToggle }: Props = $props();

	let menuItems = $derived([
		{ name: '概览', href: '/admin/dashboard', icon: LayoutDashboard },
		{ name: '文章管理', href: '/admin/articles', icon: FileText },
		{ name: '项目管理', href: '/admin/projects', icon: FolderGit2 },
		...(isAdmin
			? [
					{ name: '资源管理', href: '/admin/resources', icon: Library },
					{ name: '用户管理', href: '/admin/users', icon: Users },
					{ name: '分类管理', href: '/admin/categories', icon: Tag },
					{ name: '操作日志', href: '/admin/logs', icon: ScrollText }
				]
			: [])
	]);

	let displayName = $derived(me.displayName || me.email || 'User');
	let avatarUrl = $derived(me.avatarUrl);
	let roleLabel = $derived(
		me.role === 'super_admin'
			? '超级管理员'
			: me.role === 'admin'
				? '管理员'
				: me.role === 'creator'
					? '创作者'
					: '用户'
	);

	async function handleLogout() {
		await supabase.auth.signOut();
		goto(resolve('/login'));
	}
</script>

<aside
	class="fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out flex flex-col"
	class:w-56={isOpen}
	class:w-20={!isOpen}
	class:-translate-x-full={!isOpen && false}
>
	<!-- Logo Area -->
	<div class="h-16 flex items-center justify-center border-b border-slate-100 flex-shrink-0">
		<div class="flex items-center gap-3 overflow-hidden px-4 w-full" class:justify-center={!isOpen}>
			<img src={wyNotesLogo} alt="WY Notes" class="h-8 w-8 object-contain shrink-0" />
			{#if isOpen}
				<span class="text-lg font-bold text-slate-900 tracking-tight truncate">后台面板</span>
			{/if}
		</div>
	</div>

	<!-- Toggle Button (Desktop Only usually, but keeping here for consistency with design) -->
	<div class="px-3 pt-4 pb-2 flex justify-center">
		<button
			onclick={onToggle}
			class="w-full flex items-center justify-center p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all active:scale-95 group mb-2"
			title={isOpen ? '收起菜单' : '展开菜单'}
		>
			{#if isOpen}
				<div class="flex items-center gap-2">
					<PanelLeftClose size={18} />
					<span class="text-xs font-medium tracking-wider">收起菜单</span>
				</div>
			{:else}
				<PanelLeftOpen size={18} />
			{/if}
		</button>
	</div>

	<!-- Navigation -->
	<nav class="flex-grow overflow-y-auto custom-scrollbar p-3 space-y-1">
		{#each menuItems as item (item.href)}
			{@const isActive = $page.url.pathname.startsWith(item.href)}
			<a
				href={resolve(item.href)}
				class="relative flex items-center px-3 py-2.5 rounded-lg transition-all group overflow-hidden whitespace-nowrap"
				class:bg-slate-100={isActive}
				class:text-slate-900={isActive}
				class:text-slate-600={!isActive}
				class:hover:bg-slate-50={!isActive}
				class:hover:text-slate-900={!isActive}
				class:justify-center={!isOpen}
				title={!isOpen ? item.name : ''}
			>
				{#if isActive}
					<div
						class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-sky-500 rounded-r-full"
					></div>
				{/if}

				<item.icon
					size={20}
					class="shrink-0 transition-colors {isActive
						? 'text-sky-600'
						: 'text-slate-500 group-hover:text-slate-700'}"
				/>

				{#if isOpen}
					<span class="ml-3 font-medium text-sm truncate">{item.name}</span>
				{/if}
			</a>
		{/each}
	</nav>

	<!-- User Profile Footer -->
	<div class="p-3 border-t border-slate-100">
		<div class="flex flex-col gap-2">
			<a
				href={resolve('/admin/profile')}
				class="flex items-center p-2 rounded-lg hover:bg-slate-50 transition-colors group"
				class:justify-center={!isOpen}
				title={!isOpen ? '个人设置' : ''}
			>
				{#if avatarUrl}
					<img
						src={avatarUrl}
						alt={displayName}
						class="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0"
					/>
				{:else}
					<div
						class="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0"
					>
						<User size={16} />
					</div>
				{/if}

				{#if isOpen}
					<div class="ml-3 min-w-0 flex-1">
						<p class="text-sm font-bold text-slate-900 truncate">{displayName}</p>
						<p class="text-[10px] text-slate-500 truncate">{roleLabel}</p>
					</div>
				{/if}
			</a>

			<button
				onclick={handleLogout}
				class="flex items-center justify-center p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors w-full"
				class:justify-start={isOpen}
				title="退出登录"
			>
				<LogOut size={18} />
				{#if isOpen}
					<span class="ml-3 text-xs font-medium">退出登录</span>
				{/if}
			</button>
		</div>
	</div>
</aside>
