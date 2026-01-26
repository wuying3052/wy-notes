<script lang="ts">
	import { onMount } from 'svelte';
	import { X, Save, Trash2, Pencil, GitMerge, Plus } from 'lucide-svelte';
	import { notify } from '$lib/feedback/notify';
	import { supabase } from '$lib/supabase';
	import { confirm } from '$lib/feedback/confirm';
	import { normalizeCategoryKey } from '$lib/utils/category';

	type Kind = 'resource' | 'article';

	type ItemWithCategory = {
		category_id?: string | null;
	};

	type Category = { id: string; name: string; key: string };

	let { kind, items, onClose, onChanged } = $props<{
		kind: Kind;
		items: ItemWithCategory[];
		onClose: () => void;
		onChanged: () => void;
	}>();

	let dbCategories = $state<Category[]>([]);
	let isLoading = $state(false);
	let isSaving = $state(false);

	let creatingName = $state('');
	let editingId = $state<string | null>(null);
	let editingName = $state('');
	let mergingSourceId = $state<string | null>(null);
	let mergingTargetId = $state('');

	let renameInputEl = $state<HTMLInputElement | null>(null);

	const entityTable = $derived(kind === 'resource' ? 'resources' : 'articles');
	const uncategorizedName = '未分类';

	$effect(() => {
		if (!editingId) return;
		queueMicrotask(() => renameInputEl?.focus());
	});

	function countByCategoryId(categoryId: string): number {
		let count = 0;
		for (const it of items) {
			if ((it.category_id ?? null) === categoryId) count += 1;
		}
		return count;
	}

	async function fetchCategories() {
		isLoading = true;
		try {
			const { data, error } = await supabase
				.from('categories')
				.select('id,name,key')
				.eq('kind', kind)
				.order('name', { ascending: true });
			if (error) throw error;
			dbCategories = (data as Category[] | null) ?? [];
		} catch (e) {
			notify.error(e);
		} finally {
			isLoading = false;
		}
	}

	async function ensureCategoryIdByName(name: string): Promise<string> {
		const normalizedName = name.trim();
		const key = normalizeCategoryKey(normalizedName);

		const { data: inserted, error: insertError } = await supabase
			.from('categories')
			.insert({ kind, name: normalizedName, key })
			.select('id,name,key')
			.single();

		if (!insertError) return (inserted as Category).id;

		const { data: matched, error: matchError } = await supabase
			.from('categories')
			.select('id,name,key')
			.eq('kind', kind)
			.eq('key', key)
			.maybeSingle();

		if (matchError) throw matchError;
		if (!matched) throw insertError;
		return (matched as Category).id;
	}

	async function createCategory() {
		const name = creatingName.trim();
		if (!name) return;

		isSaving = true;
		try {
			await ensureCategoryIdByName(name);
			creatingName = '';
			notify.success('分类已创建');
			await fetchCategories();
			onChanged();
		} catch (e) {
			notify.error(e);
		} finally {
			isSaving = false;
		}
	}

	function handleRename(category: Category) {
		editingId = category.id;
		editingName = category.name;
	}

	async function mergeCategories(sourceId: string, targetId: string) {
		if (sourceId === targetId) return;
		const source = dbCategories.find((c) => c.id === sourceId);
		const target = dbCategories.find((c) => c.id === targetId);
		if (!source || !target) return;

		const count = countByCategoryId(sourceId);
		const ok = await confirm({
			title: `合并分类 "${source.name}" → "${target.name}"？`,
			description: `这将影响 ${count} 个条目。合并后将删除源分类。`,
			confirmText: '合并',
			danger: true
		});
		if (!ok) return;

		isSaving = true;
		try {
			const { error: updateError } = await supabase
				.from(entityTable)
				.update({ category_id: target.id, category: target.name })
				.eq('category_id', source.id);
			if (updateError) throw updateError;

			const { error: deleteError } = await supabase.from('categories').delete().eq('id', source.id);
			if (deleteError) throw deleteError;

			notify.success('分类已合并');
			await fetchCategories();
			onChanged();
		} catch (e) {
			notify.error(e);
		} finally {
			isSaving = false;
			mergingSourceId = null;
			mergingTargetId = '';
			editingId = null;
		}
	}

	async function saveRename() {
		if (!editingId) return;
		const newName = editingName.trim();
		if (!newName) return;

		const current = dbCategories.find((c) => c.id === editingId);
		if (!current) return;
		if (newName === current.name) {
			editingId = null;
			return;
		}

		const newKey = normalizeCategoryKey(newName);
		const conflict = dbCategories.find((c) => c.key === newKey && c.id !== editingId);
		if (conflict) {
			await mergeCategories(editingId, conflict.id);
			return;
		}

		isSaving = true;
		try {
			const { error } = await supabase
				.from('categories')
				.update({ name: newName, key: newKey })
				.eq('id', editingId);
			if (error) throw error;

			notify.success('分类已重命名');
			await fetchCategories();
			onChanged();
			editingId = null;
		} catch (e) {
			notify.error(e);
		} finally {
			isSaving = false;
		}
	}

	async function handleDelete(category: Category) {
		const count = countByCategoryId(category.id);
		const ok = await confirm({
			title: `确定删除分类 "${category.name}" 吗？`,
			description: `这将影响 ${count} 个条目。这些条目将移至“${uncategorizedName}”。`,
			confirmText: '删除',
			danger: true
		});
		if (!ok) return;

		isSaving = true;
		try {
			const uncategorizedId = await ensureCategoryIdByName(uncategorizedName);

			const { error: moveError } = await supabase
				.from(entityTable)
				.update({ category_id: uncategorizedId, category: uncategorizedName })
				.eq('category_id', category.id);
			if (moveError) throw moveError;

			const { error: deleteError } = await supabase
				.from('categories')
				.delete()
				.eq('id', category.id);
			if (deleteError) throw deleteError;

			notify.success('分类已删除');
			await fetchCategories();
			onChanged();
		} catch (e) {
			notify.error(e);
		} finally {
			isSaving = false;
		}
	}

	onMount(fetchCategories);
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
	<div class="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[80vh]">
		<div class="p-6 border-b border-slate-100 flex items-center justify-between">
			<h2 class="text-xl font-bold text-slate-900">管理分类</h2>
			<button
				onclick={onClose}
				class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
			>
				<X size={20} />
			</button>
		</div>

		<div class="flex-1 overflow-y-auto p-6 space-y-2">
			<div class="flex items-center gap-2 pb-4">
				<input
					bind:value={creatingName}
					placeholder="新增分类，例如：前端"
					class="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
					onkeydown={(e) => e.key === 'Enter' && createCategory()}
				/>
				<button
					class="h-10 px-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
					onclick={createCategory}
					disabled={isSaving || isLoading}
					title="创建"
				>
					<Plus size={18} />
				</button>
			</div>

			{#if isLoading}
				<p class="text-slate-500 text-center py-8">加载中...</p>
			{:else if dbCategories.length === 0}
				<p class="text-slate-500 text-center py-8">暂无分类</p>
			{:else}
				{#each dbCategories as cat (cat.id)}
					<div
						class="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 group hover:border-slate-200 transition-colors"
					>
						{#if editingId === cat.id}
							<input
								type="text"
								bind:value={editingName}
								bind:this={renameInputEl}
								class="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
								onkeydown={(e) => e.key === 'Enter' && saveRename()}
							/>
							<div class="flex items-center gap-2 ml-3">
								<button
									onclick={saveRename}
									disabled={isSaving}
									class="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
								>
									<Save size={18} />
								</button>
								<button
									onclick={() => (editingId = null)}
									disabled={isSaving}
									class="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
								>
									<X size={18} />
								</button>
							</div>
						{:else}
							<div class="min-w-0 flex-1 ml-2">
								<div class="font-medium text-slate-700 truncate">{cat.name}</div>
								<div class="text-xs text-slate-400 mt-0.5">{countByCategoryId(cat.id)} 个条目</div>
							</div>
							<div
								class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
							>
								<button
									onclick={() => handleRename(cat)}
									class="p-1.5 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors"
									title="重命名"
								>
									<Pencil size={16} />
								</button>
								<button
									onclick={() => {
										mergingSourceId = cat.id;
										mergingTargetId = '';
									}}
									class="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
									title="合并到..."
								>
									<GitMerge size={16} />
								</button>
								<button
									onclick={() => handleDelete(cat)}
									class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
									title="删除（移动到未分类）"
								>
									<Trash2 size={16} />
								</button>
							</div>
						{/if}
					</div>

					{#if mergingSourceId === cat.id}
						<div class="px-3 pb-3">
							<div class="flex items-center gap-2">
								<select
									class="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
									bind:value={mergingTargetId}
								>
									<option value="" disabled selected>选择目标分类</option>
									{#each dbCategories as target (target.id)}
										{#if target.id !== cat.id}
											<option value={target.id}>{target.name}</option>
										{/if}
									{/each}
								</select>
								<button
									class="h-10 px-4 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
									disabled={!mergingTargetId || isSaving}
									onclick={() => mergingTargetId && mergeCategories(cat.id, mergingTargetId)}
								>
									合并
								</button>
								<button
									class="h-10 px-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
									onclick={() => {
										mergingSourceId = null;
										mergingTargetId = '';
									}}
								>
									取消
								</button>
							</div>
						</div>
					{/if}
				{/each}
			{/if}
		</div>

		<div class="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
			<p class="text-xs text-slate-500">
				重命名会按规范化 key 去重；如撞车会自动触发合并，合并/删除会批量迁移数据。
			</p>
		</div>
	</div>
</div>
