<script lang="ts">
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { ArrowLeft, Save, ExternalLink } from 'lucide-svelte';
	import { supabase } from '$lib/supabase';
	import { notify } from '$lib/feedback/notify';
	import { normalizeCategoryKey } from '$lib/utils/category';

	type ResourceEntity = {
		id: string;
		title: string | null;
		description: string | null;
		url: string | null;
		icon: string | null;
		category: string | null;
		category_id?: string | null;
		category_name?: string | null;
		tags: string[] | null;
	};

	let { data }: { data: PageData } = $props();
	let resource = $derived(data.resource as ResourceEntity);

	let form = $state({
		title: '',
		desc: '',
		url: '',
		icon: '',
		category: '未分类',
		tags: ''
	});
	let errors = $state<Record<string, string>>({});
	let isSaving = $state(false);

	let previewTags = $derived(
		form.tags
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean)
	);

	type Category = { id: string; name: string };
	let categories = $derived(((data as { categories?: Category[] }).categories ?? []) as Category[]);
	let categoryId = $state<string | null>(null);

	let categoryMatch = $derived.by(() => {
		const name = form.category.trim();
		if (!name) return null;
		const key = normalizeCategoryKey(name);
		const matched = categories.find((c) => normalizeCategoryKey(c.name) === key);
		if (!matched) return null;
		if (matched.name === name) return null;
		return matched;
	});

	$effect(() => {
		if (!resource) return;
		form.title = resource.title ?? '';
		form.desc = resource.description ?? '';
		form.url = resource.url ?? '';
		form.icon = resource.icon ?? '';
		categoryId = (resource.category_id ?? null) as string | null;
		form.category = resource.category_name ?? resource.category ?? '未分类';
		form.tags = Array.isArray(resource.tags) ? resource.tags.join(', ') : '';
	});

	function isValidUrl(value: string): boolean {
		try {
			new URL(value);
			return true;
		} catch {
			return false;
		}
	}

	function validate() {
		const fieldErrors: Record<string, string> = {};
		if (!form.title.trim()) fieldErrors['title'] = '资源名称不能为空';
		if (!form.url.trim()) fieldErrors['url'] = '链接 URL 不能为空';
		if (form.url.trim() && !isValidUrl(form.url)) fieldErrors['url'] = 'URL 格式不正确';
		if (form.icon.trim() && !isValidUrl(form.icon)) fieldErrors['icon'] = '图标 URL 格式不正确';
		if (!form.category.trim()) fieldErrors['category'] = '分类不能为空';
		errors = fieldErrors;
		return Object.keys(fieldErrors).length === 0;
	}

	async function saveResource() {
		if (!validate()) {
			notify.validation(Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, v])));
			return;
		}

		isSaving = true;
		const toastId = notify.loading('保存中...', { description: '正在更新资源信息' });
		try {
			const categoryName = form.category.trim();
			const existing = categories.find((c) => c.name === categoryName);
			if (existing) {
				categoryId = existing.id;
			} else {
				const key = normalizeCategoryKey(categoryName);
				const { data: inserted, error: insertError } = await supabase
					.from('categories')
					.insert({ kind: 'resource', name: categoryName, key })
					.select('id,name')
					.single();

				if (insertError) {
					const { data: matched } = await supabase
						.from('categories')
						.select('id,name')
						.eq('kind', 'resource')
						.eq('key', key)
						.maybeSingle();

					if (!matched) throw insertError;
					categoryId = matched.id;
				} else {
					categoryId = inserted.id;
				}
			}

			const payload = {
				title: form.title.trim(),
				description: form.desc.trim() || null,
				url: form.url.trim(),
				icon: form.icon.trim() || null,
				category_id: categoryId,
				category: categoryName,
				tags: previewTags
			};

			const { error } = await supabase.from('resources').update(payload).eq('id', resource.id);
			if (error) throw error;

			notify.success('保存成功', { id: toastId });
			await goto(resolve('/admin/resources'));
		} catch (e) {
			notify.error(e, { id: toastId, mode: 'manual' });
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="max-w-6xl mx-auto pb-20">
	<header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
		<div class="flex items-center gap-3">
			<a
				href={resolve('/admin/resources')}
				class="p-2 -ml-2 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-full transition-colors"
			>
				<ArrowLeft size={22} />
			</a>
			<div>
				<h1 class="text-2xl font-bold text-slate-900">编辑资源</h1>
				<p class="text-sm text-slate-500 mt-1">更新资源信息并保存。</p>
			</div>
		</div>
		<button
			onclick={saveResource}
			disabled={isSaving}
			class="h-10 px-4 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors inline-flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
		>
			<Save size={18} />
			<span>{isSaving ? '保存中...' : '保存更改'}</span>
		</button>
	</header>

	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
		<div class="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
			<h2 class="text-sm font-bold text-slate-900">基本信息</h2>
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1" for="title">资源名称</label>
					<input
						id="title"
						bind:value={form.title}
						placeholder="例如：Figma"
						class="w-full px-4 py-2 bg-white border rounded-lg outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand"
						class:border-rose-300={Boolean(errors.title)}
					/>
					{#if errors.title}
						<p class="mt-1 text-xs text-rose-600">{errors.title}</p>
					{/if}
				</div>

				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1" for="desc">简介</label>
					<textarea
						id="desc"
						bind:value={form.desc}
						rows="3"
						placeholder="简短描述..."
						class="w-full px-4 py-2 bg-white border rounded-lg outline-none transition-all resize-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
					></textarea>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-slate-700 mb-1" for="category">分类</label>
						<input
							id="category"
							bind:value={form.category}
							placeholder="例如：设计工具 / 开发工具"
							class="w-full px-4 py-2 bg-white border rounded-lg outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand"
							class:border-rose-300={Boolean(errors.category)}
							list="resource-categories"
						/>
						<datalist id="resource-categories">
							{#each categories as c (c.id)}
								<option value={c.name}></option>
							{/each}
						</datalist>
						{#if categoryMatch}
							<p class="mt-1 text-xs text-slate-500">
								将自动归并为：<span class="font-medium text-slate-700">{categoryMatch.name}</span>
							</p>
						{/if}
						{#if errors.category}
							<p class="mt-1 text-xs text-rose-600">{errors.category}</p>
						{/if}
					</div>
					<div>
						<label class="block text-sm font-medium text-slate-700 mb-1" for="tags"
							>标签（逗号分隔）</label
						>
						<input
							id="tags"
							bind:value={form.tags}
							placeholder="UI, 设计"
							class="w-full px-4 py-2 bg-white border rounded-lg outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand"
						/>
					</div>
				</div>

				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1" for="url">链接 URL</label>
					<input
						id="url"
						bind:value={form.url}
						placeholder="https://..."
						class="w-full px-4 py-2 bg-white border rounded-lg outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand"
						class:border-rose-300={Boolean(errors.url)}
					/>
					{#if errors.url}
						<p class="mt-1 text-xs text-rose-600">{errors.url}</p>
					{/if}
				</div>

				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1" for="icon">图标 URL</label>
					<input
						id="icon"
						bind:value={form.icon}
						placeholder="https://..."
						class="w-full px-4 py-2 bg-white border rounded-lg outline-none transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand"
						class:border-rose-300={Boolean(errors.icon)}
					/>
					{#if errors.icon}
						<p class="mt-1 text-xs text-rose-600">{errors.icon}</p>
					{/if}
				</div>
			</div>
		</div>

		<div class="lg:col-span-5 space-y-6">
			<h2 class="text-sm font-bold text-slate-900 flex items-center gap-2">
				<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
				<span>预览</span>
			</h2>

			<div class="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300">
				<div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
					<div class="flex items-start justify-between mb-4">
						<div
							class="w-12 h-12 rounded-xl bg-slate-50 p-2 flex items-center justify-center border border-slate-100"
						>
							{#if form.icon}
								<img src={form.icon} alt={form.title} class="w-full h-full object-contain" />
							{:else}
								<div class="text-xs text-slate-400">Icon</div>
							{/if}
						</div>
						<ExternalLink size={16} class="text-slate-300" />
					</div>
					<h3 class="font-bold text-slate-900 mb-1">{form.title || '资源标题'}</h3>
					<p class="text-sm text-slate-500 leading-relaxed">
						{form.desc || '这里是资源的简短描述信息...'}
					</p>
					<div class="flex flex-wrap gap-2 pt-4 border-t border-slate-100 mt-4">
						{#each previewTags as tag, index (index)}
							<span
								class="px-2 py-0.5 rounded-md bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wide"
								>{tag}</span
							>
						{:else}
							<span
								class="px-2 py-0.5 rounded-md bg-slate-50 text-slate-300 text-[10px] font-bold uppercase tracking-wide"
								>TAG</span
							>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
