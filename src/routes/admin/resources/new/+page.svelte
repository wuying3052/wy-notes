<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { Save, ArrowLeft, ExternalLink } from 'lucide-svelte';
	import { supabase } from '$lib/supabase';
	import { notify } from '$lib/feedback/notify';
	import { normalizeCategoryKey } from '$lib/utils/category';

	type Category = { id: string; name: string };

	let { data } = $props();
	let categories = $derived(((data as { categories?: Category[] }).categories ?? []) as Category[]);

	let form = $state({
		title: '',
		desc: '',
		url: '',
		icon: '',
		category: '未分类',
		tags: ''
	});

	let previewTags = $derived(
		form.tags
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean)
	);

	let isSaving = $state(false);
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

	function isValidUrl(value: string): boolean {
		try {
			new URL(value);
			return true;
		} catch {
			return false;
		}
	}

	async function saveResource() {
		const fieldErrors: Record<string, string> = {};
		if (!form.title.trim()) fieldErrors['资源名称'] = '不能为空';
		if (!form.url.trim()) fieldErrors['链接 URL'] = '不能为空';
		if (form.url.trim() && !isValidUrl(form.url)) fieldErrors['链接 URL'] = 'URL 格式不正确';
		if (form.icon.trim() && !isValidUrl(form.icon)) fieldErrors['图标 URL'] = 'URL 格式不正确';
		const categoryName = form.category.trim();
		if (!categoryName) fieldErrors['分类'] = '不能为空';

		if (Object.keys(fieldErrors).length) {
			notify.validation(fieldErrors);
			return;
		}

		isSaving = true;
		try {
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

			const { error } = await supabase.from('resources').insert(payload);
			if (error) throw error;

			notify.success('toast.saved');
			await goto(resolve('/admin/resources'));
		} catch (error: unknown) {
			notify.error(error);
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="max-w-6xl mx-auto pb-20">
	<header class="flex items-center justify-between mb-8">
		<div class="flex items-center space-x-4">
			<a
				href={resolve('/admin/resources')}
				class="p-2 -ml-2 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-full transition-colors"
			>
				<ArrowLeft size={24} />
			</a>
			<h1 class="text-2xl font-bold text-slate-900">添加新资源</h1>
		</div>
		<button
			onclick={saveResource}
			disabled={isSaving}
			class="px-5 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors flex items-center space-x-2 shadow-lg"
			class:opacity-70={isSaving}
			class:cursor-not-allowed={isSaving}
		>
			<Save size={18} />
			<span>{isSaving ? '保存中...' : '保存资源'}</span>
		</button>
	</header>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
		<div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
			<h3 class="font-bold text-slate-900 border-b border-slate-100 pb-4 mb-2">基本信息</h3>

			<div class="space-y-4">
				<div>
					<label for="title" class="block text-sm font-medium text-slate-700 mb-1">资源名称</label>
					<input
						type="text"
						id="title"
						bind:value={form.title}
						placeholder="例如: Figma"
						class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
					/>
				</div>

				<div>
					<label for="desc" class="block text-sm font-medium text-slate-700 mb-1">简介</label>
					<textarea
						id="desc"
						bind:value={form.desc}
						rows="2"
						placeholder="简短描述..."
						class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all resize-none"
					></textarea>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="category" class="block text-sm font-medium text-slate-700 mb-1">分类</label>
						<input
							id="category"
							bind:value={form.category}
							placeholder="例如：设计工具 / 开发工具"
							class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
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
					</div>
					<div>
						<label for="tags" class="block text-sm font-medium text-slate-700 mb-1"
							>标签 (逗号分隔)</label
						>
						<input
							type="text"
							id="tags"
							bind:value={form.tags}
							placeholder="UI, 设计"
							class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
						/>
					</div>
				</div>

				<div>
					<label for="url" class="block text-sm font-medium text-slate-700 mb-1">链接 URL</label>
					<input
						type="url"
						id="url"
						bind:value={form.url}
						placeholder="https://..."
						class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
					/>
				</div>

				<div>
					<label for="icon" class="block text-sm font-medium text-slate-700 mb-1">图标 URL</label>
					<input
						type="url"
						id="icon"
						bind:value={form.icon}
						placeholder="https://..."
						class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
					/>
				</div>
			</div>
		</div>

		<div class="space-y-6">
			<h3 class="font-bold text-slate-900 flex items-center space-x-2">
				<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
				<span>实时预览</span>
			</h3>

			<div
				class="bg-slate-50 p-8 rounded-3xl border border-dashed border-slate-300 flex items-center justify-center min-h-[300px]"
			>
				<div
					class="bg-white p-5 rounded-2xl border border-slate-100 shadow-lg w-full max-w-sm hover:-translate-y-1 transition-transform duration-300"
				>
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

					<div class="mb-4">
						<h3 class="font-bold text-slate-900 mb-1">{form.title || '资源标题'}</h3>
						<p
							class="text-sm text-slate-500 leading-relaxed overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]"
						>
							{form.desc || '这里是资源的简短描述信息...'}
						</p>
					</div>

					<div class="flex flex-wrap gap-2 pt-4 border-t border-slate-50">
						{#each previewTags as tag, index (index)}
							<span
								class="px-2 py-0.5 rounded-md bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wide"
							>
								{tag}
							</span>
						{:else}
							<span
								class="px-2 py-0.5 rounded-md bg-slate-50 text-slate-300 text-[10px] font-bold uppercase tracking-wide"
								>TAG</span
							>
						{/each}
					</div>
				</div>
			</div>

			<p class="text-center text-sm text-slate-400">预览效果与前台实际显示一致</p>
		</div>
	</div>
</div>
