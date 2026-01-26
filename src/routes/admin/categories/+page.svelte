<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import { Plus, Pencil, Trash2, X, Tag, FolderOpen } from 'lucide-svelte';
	import { notify } from '$lib/feedback/notify';
	import { confirm } from '$lib/feedback/confirm';
	import type { PageData, ActionData } from './$types';

	let { data, form } = $props<{ data: PageData; form: ActionData }>();

	let activeKind = $state('article'); // 'article' or 'resource'
	let isModalOpen = $state(false);
	let editingCategory = $state<any>(null); // If null, creating new
	let formData = $state({ name: '', kind: 'article' });
	let isSubmitting = $state(false);

	let filteredCategories = $derived(data.categories.filter((c: any) => c.kind === activeKind));

	function openCreateModal() {
		editingCategory = null;
		formData = { name: '', kind: activeKind };
		isModalOpen = true;
	}

	function openEditModal(category: any) {
		editingCategory = category;
		formData = { name: category.name, kind: category.kind };
		isModalOpen = true;
	}

	function closeModal() {
		isModalOpen = false;
		isSubmitting = false;
	}

	async function handleDelete(id: string, name: string) {
		const ok = await confirm({
			title: '删除分类',
			description: `确定要删除分类 "${name}" 吗？此操作不可恢复。`,
			confirmText: '删除',
			danger: true
		});

		if (!ok) return;

		const formElement = document.getElementById(`delete-form-${id}`) as HTMLFormElement;
		if (formElement) formElement.requestSubmit();
	}

	$effect(() => {
		if (form?.success) {
			untrack(() => {
				closeModal();
				notify.success(editingCategory ? '更新成功' : '创建成功');
			});
		} else if (form?.message) {
			untrack(() => {
				notify.error(form.message);
				isSubmitting = false;
			});
		}
	});
</script>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-slate-900">分类管理</h1>
			<p class="text-slate-500 mt-1">管理系统中的文章和资源分类</p>
		</div>

		<!-- Tabs -->
		<div class="bg-white p-1 rounded-xl border border-slate-200 inline-flex shadow-sm">
			<button
				onclick={() => (activeKind = 'article')}
				class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all {activeKind ===
				'article'
					? 'bg-slate-100 text-slate-900 shadow-sm'
					: 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}"
			>
				<Tag size={16} />
				文章分类
			</button>
			<button
				onclick={() => (activeKind = 'resource')}
				class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all {activeKind ===
				'resource'
					? 'bg-slate-100 text-slate-900 shadow-sm'
					: 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}"
			>
				<FolderOpen size={16} />
				资源分类
			</button>
		</div>
	</div>

	<div class="flex justify-end">
		<button
			onclick={openCreateModal}
			class="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium shadow-sm"
		>
			<Plus size={18} />
			新增分类
		</button>
	</div>

	<!-- List -->
	<div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
		{#if filteredCategories.length === 0}
			<div class="p-12 text-center">
				<div
					class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4"
				>
					<Tag size={24} class="text-slate-300" />
				</div>
				<h3 class="text-lg font-medium text-slate-900">暂无分类</h3>
				<p class="text-slate-500 mt-1">点击右上角按钮添加第一个分类</p>
			</div>
		{:else}
			<table class="w-full text-sm text-left">
				<thead class="bg-slate-50/80 text-slate-500 border-b border-slate-200">
					<tr>
						<th class="px-6 py-4 font-semibold">名称</th>
						<th class="px-6 py-4 font-semibold text-right">操作</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each filteredCategories as category (category.id)}
						<tr class="group hover:bg-slate-50/50 transition-colors">
							<td class="px-6 py-4 font-medium text-slate-900">{category.name}</td>
							<td class="px-6 py-4 text-right">
								<div
									class="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity"
								>
									<button
										onclick={() => openEditModal(category)}
										class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
										title="编辑"
									>
										<Pencil size={16} />
									</button>
									<form
										action="?/delete"
										method="POST"
										id="delete-form-{category.id}"
										use:enhance={() => {
											return async ({ result }) => {
												if (result.type === 'failure') {
													notify.error(result.data?.message || '删除失败');
												} else if (result.type === 'success') {
													notify.success('删除成功');
												}
												// Success handled by effect/invalidation usually, wait for it
											};
										}}
									>
										<input type="hidden" name="id" value={category.id} />
										<button
											type="button"
											onclick={() => handleDelete(category.id, category.name)}
											class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
											title="删除"
										>
											<Trash2 size={16} />
										</button>
									</form>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>

<!-- Modal -->
{#if isModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
		<div
			class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
		>
			<div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
				<h3 class="text-lg font-bold text-slate-900">
					{editingCategory ? '编辑分类' : '新增分类'}
				</h3>
				<button onclick={closeModal} class="text-slate-400 hover:text-slate-600">
					<X size={20} />
				</button>
			</div>

			<form
				method="POST"
				action={editingCategory ? '?/update' : '?/create'}
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						await update();
						// Loading state is reset via prop change or effect,
						// but if validation fails server-side, we need to handle it.
						// The effect hook handles success/failure notifications.
					};
				}}
				class="p-6 space-y-4"
			>
				{#if editingCategory}
					<input type="hidden" name="id" value={editingCategory.id} />
				{/if}
				<input type="hidden" name="kind" value={formData.kind} />

				<div>
					<label for="name" class="block text-sm font-medium text-slate-700 mb-1">名称</label>
					<input
						type="text"
						name="name"
						id="name"
						bind:value={formData.name}
						placeholder="例如：前端开发"
						required
						class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
					/>
				</div>

				<div class="pt-2 flex justify-end gap-3">
					<button
						type="button"
						onclick={closeModal}
						class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
					>
						取消
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						class="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-70"
					>
						{isSubmitting ? '提交中...' : '确定'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
