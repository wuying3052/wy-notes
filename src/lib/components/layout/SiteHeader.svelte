<script lang="ts">
	import { resolve } from '$app/paths';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { Menu, X } from 'lucide-svelte';
	import { tick } from 'svelte';
	import BrandIcon from '$lib/components/BrandIcon.svelte';
	import { siteNavItems } from '$lib/site/nav';

	let { logoSrc, siteName } = $props<{
		logoSrc: string;
		siteName: string;
	}>();

	let mobileOpen = $state(false);
	let closeBtnEl = $state<HTMLButtonElement | null>(null);

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
		}
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
				<a
					href="https://github.com/wying3052/wy-notes"
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
				<a
					href="https://github.com/wying3052/wy-notes"
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
