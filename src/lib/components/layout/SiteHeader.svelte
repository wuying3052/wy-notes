<script lang="ts">
	import { resolve } from '$app/paths';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { Menu, X, LogIn, User as UserIcon } from 'lucide-svelte';
	import { tick } from 'svelte';
	import BrandIcon from '$lib/components/BrandIcon.svelte';
	import { siteNavItems } from '$lib/site/nav';
	import type { User } from '@supabase/supabase-js';
	import { supabase } from '$lib/supabase';
	import EditProfileModal from '$lib/components/modals/EditProfileModal.svelte';
	import ChangePasswordModal from '$lib/components/modals/ChangePasswordModal.svelte';

	let { logoSrc, siteName, user, profile } = $props<{
		logoSrc: string;
		siteName: string;
		user: User | null;
		profile: any;
	}>();

	let mobileOpen = $state(false);
	let dropdownOpen = $state(false);
	let editProfileOpen = $state(false);
	let changePasswordOpen = $state(false);
	let closeBtnEl = $state<HTMLButtonElement | null>(null);
	let dropdownRef = $state<HTMLDivElement | null>(null);
	let closeTimeout: number | undefined;

	const currentPath = $derived($page.url.pathname);

	const isActive = (href: string) => {
		if (href === '/') return currentPath === '/';
		return currentPath === href || currentPath.startsWith(`${href}/`);
	};

	const setBodyScrollLocked = (locked: boolean) => {
		if (!browser) return;
		document.body.style.overflow = locked ? 'hidden' : '';
	};

	const openMobile = async () => {
		mobileOpen = true;
		setBodyScrollLocked(true);
		await tick();
		closeBtnEl?.focus();
	};

	const closeMobile = () => {
		mobileOpen = false;
		setBodyScrollLocked(false);
	};

	const onWindowKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Escape') {
			if (mobileOpen) closeMobile();
			if (dropdownOpen) dropdownOpen = false;
		}
	};

	const handleLogout = async () => {
		const { error } = await supabase.auth.signOut();
		if (!error) {
			window.location.href = '/';
		}
	};

	const showDropdown = () => {
		if (closeTimeout) clearTimeout(closeTimeout);
		dropdownOpen = true;
	};

	const hideDropdownWithDelay = () => {
		closeTimeout = window.setTimeout(() => {
			dropdownOpen = false;
		}, 200);
	};
</script>

<nav class="fixed top-0 inset-x-0 z-50 glass">
	<div class="mx-auto w-full px-4 sm:px-8 lg:px-12">
		<div class="flex h-16 items-center justify-between gap-4">
			<div class="flex items-center gap-10">
				<a
					href={resolve('/')}
					class="flex items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
				>
					<img src={logoSrc} alt={siteName} class="h-10 w-auto" />
					<span class="hidden sm:inline text-sm font-extrabold tracking-tight text-slate-900"
						>{siteName}</span
					>
				</a>

				<div class="hidden md:flex items-center gap-1">
					{#each siteNavItems as item (item.href)}
						<a
							href={resolve(item.href)}
							aria-current={isActive(item.href) ? 'page' : undefined}
							class={'rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 ' +
								(isActive(item.href)
									? 'text-slate-900 bg-white/70'
									: 'text-slate-600 hover:text-slate-900 hover:bg-white/50')}
						>
							{item.name}
						</a>
					{/each}
				</div>
			</div>

			<div class="flex items-center gap-2">
				{#if user}
					<div
						class="relative hidden md:block"
						onmouseenter={showDropdown}
						onmouseleave={hideDropdownWithDelay}
						role="none"
					>
						<button
							type="button"
							class="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 bg-white/40 hover:bg-white/80 py-1 pl-3 pr-1 rounded-full transition-all border border-white/50"
							aria-label="用户菜单"
							aria-expanded={dropdownOpen}
							aria-haspopup="true"
							onclick={() => (dropdownOpen = !dropdownOpen)}
						>
							<span
								class="text-xs font-bold text-slate-700 group-hover:text-brand transition-colors"
							>
								{profile?.display_name || '用户'}
							</span>
							{#if profile?.avatar_url || user.user_metadata.avatar_url}
								<img
									src={profile?.avatar_url || user.user_metadata.avatar_url}
									alt={profile?.display_name || 'User'}
									class="h-8 w-8 rounded-full shadow-sm border border-white/80 transition-transform group-hover:scale-110"
								/>
							{:else}
								<div
									class="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0 shadow-sm transition-transform group-hover:scale-110"
								>
									<UserIcon size={16} />
								</div>
							{/if}
						</button>

						{#if dropdownOpen}
							<div
								class="absolute left-1/2 -translate-x-1/2 mt-2 w-56 origin-top rounded-2xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl overflow-hidden z-50 py-1 animate-in fade-in zoom-in duration-200"
								role="menu"
								tabindex="-1"
								onmouseenter={showDropdown}
							>
								<div class="px-4 py-2 border-b border-slate-200/50 mb-1" role="none">
									<p class="text-xs font-bold text-slate-400 uppercase tracking-wider">个人中心</p>
								</div>

								{#if ['creator', 'admin', 'super_admin'].includes(profile?.role)}
									<a
										href={resolve('/admin')}
										class="flex items-center px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-white/50 hover:text-brand transition-colors"
										role="menuitem"
										onclick={() => {
											dropdownOpen = false;
											if (closeTimeout) clearTimeout(closeTimeout);
										}}
									>
										管理后台
									</a>
								{/if}

								<button
									type="button"
									class="w-full flex items-center px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-white/50 hover:text-brand transition-colors text-left"
									role="menuitem"
									onclick={() => {
										editProfileOpen = true;
										dropdownOpen = false;
									}}
								>
									编辑资料
								</button>
								<button
									type="button"
									class="w-full flex items-center px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-white/50 hover:text-brand transition-colors text-left"
									role="menuitem"
									onclick={() => {
										changePasswordOpen = true;
										dropdownOpen = false;
									}}
								>
									修改密码
								</button>

								<div class="px-2 py-1 mt-1 border-t border-slate-200/50" role="none">
									<button
										type="button"
										class="w-full flex items-center px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50/50 rounded-xl transition-colors"
										role="menuitem"
										onclick={handleLogout}
									>
										退出登录
									</button>
								</div>
							</div>
						{/if}
					</div>
				{:else}
					<a
						href={resolve('/login')}
						class="hidden md:inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 hover:text-white hover:bg-slate-900 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
					>
						<LogIn size={18} />
						<span>登录</span>
					</a>
				{/if}

				<a
					href="https://github.com"
					target="_blank"
					rel="noreferrer"
					class="hidden md:inline-flex items-center justify-center rounded-xl p-2 text-slate-500 hover:text-slate-900 hover:bg-white/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
					aria-label="GitHub"
				>
					<BrandIcon name="github" size={20} />
				</a>

				<button
					type="button"
					class="md:hidden inline-flex items-center justify-center rounded-xl p-2 text-slate-700 hover:bg-white/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
					aria-label="打开菜单"
					onclick={() => openMobile()}
				>
					<Menu size={20} />
				</button>
			</div>
		</div>
	</div>
</nav>

<svelte:window onkeydown={onWindowKeydown} />

<EditProfileModal bind:open={editProfileOpen} {profile} />
<ChangePasswordModal bind:open={changePasswordOpen} />

{#if mobileOpen}
	<div class="fixed inset-0 z-[60]">
		<button
			type="button"
			class="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
			aria-label="关闭菜单"
			onclick={() => closeMobile()}
		></button>

		<div
			role="dialog"
			aria-modal="true"
			aria-label="站点导航"
			class="absolute right-3 top-3 w-[min(92vw,22rem)] rounded-2xl bg-white/90 backdrop-blur-md border border-white/60 shadow-2xl"
		>
			<div class="flex items-center justify-between px-4 py-3 border-b border-slate-200/50">
				<div class="flex items-center gap-3">
					<img src={logoSrc} alt={siteName} class="h-9 w-auto" />
					<span class="text-sm font-extrabold tracking-tight text-slate-900">{siteName}</span>
				</div>
				<button
					bind:this={closeBtnEl}
					type="button"
					class="inline-flex items-center justify-center rounded-xl p-2 text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
					aria-label="关闭菜单"
					onclick={() => closeMobile()}
				>
					<X size={18} />
				</button>
			</div>

			<div class="px-2 py-2">
				{#each siteNavItems as item (item.href)}
					<a
						href={resolve(item.href)}
						aria-current={isActive(item.href) ? 'page' : undefined}
						onclick={() => closeMobile()}
						class={'flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 ' +
							(isActive(item.href)
								? 'bg-slate-900 text-white'
								: 'text-slate-700 hover:bg-slate-100')}
					>
						<span>{item.name}</span>
						<span class="text-xs text-slate-400">↵</span>
					</a>
				{/each}
			</div>

			<div class="px-4 pb-4 pt-2">
				{#if user}
					<a
						href={resolve('/admin')}
						class="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 mb-2 transition-colors"
					>
						{#if profile?.avatar_url || user.user_metadata.avatar_url}
							<img
								src={profile?.avatar_url || user.user_metadata.avatar_url}
								alt={profile?.display_name || 'User'}
								class="h-6 w-6 rounded-full"
							/>
						{:else}
							<div
								class="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0"
							>
								<UserIcon size={12} />
							</div>
						{/if}
						<span>{profile?.display_name || '管理后台'}</span>
					</a>
				{:else}
					<a
						href={resolve('/login')}
						class="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-brand hover:bg-brand/5 mb-2 transition-colors"
					>
						<LogIn size={18} />
						<span>登录</span>
					</a>
				{/if}

				<a
					href="https://github.com"
					target="_blank"
					rel="noreferrer"
					class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
				>
					<BrandIcon name="github" size={18} />
					<span>GitHub</span>
				</a>
			</div>
		</div>
	</div>
{/if}
