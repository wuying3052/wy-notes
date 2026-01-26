<script lang="ts">
	import { uploadImage } from '$lib/utils/upload';
	import Editor from '$lib/components/editor/Editor.svelte';
	import { resolve } from '$app/paths';
	import { ArrowLeft, Save, Image as ImageIcon, Settings } from 'lucide-svelte';
	import { notify } from '$lib/feedback/notify';
	import { untrack } from 'svelte';
	import { pinyin } from 'pinyin-pro';
	import { supabase } from '$lib/supabase';

	type Category = { id: string; name: string };

	type Props = {
		article?: {
			title: string | null;
			slug: string | null;
			content: string | null;
			excerpt: string | null;
			tags: string[] | null;
			published: boolean | null;
			cover_image: string | null;
			category?: string | null; // 旧的字符串类型分类
			category_id?: string | null;
			category_name?: string | null;
		};
		categories: Category[];
		isSaving: boolean;
		onSave: (data: any) => Promise<void>;
	};

	let { article, categories, isSaving, onSave }: Props = $props();

	let title = $state('');
	let slug = $state('');
	let content = $state('');
	let excerpt = $state('');
	let tags = $state<string[]>([]);
	let categoryName = $state('');
	let isPublished = $state(false);
	let coverImage = $state('');

	let isUploading = $state(false);
	let errors = $state<Record<string, string>>({});
	let fileInput = $state<HTMLInputElement>();

	let isSlugManuallyEdited = $state(false);
	let isInitialized = false;

	$effect(() => {
		if (article && !isInitialized) {
			untrack(() => {
				title = article!.title ?? '';
				slug = article!.slug ?? '';
				content = article!.content ?? '';
				excerpt = article!.excerpt ?? '';
				tags = Array.isArray(article!.tags) ? article!.tags : [];
				categoryName = article!.category_name ?? article!.category ?? '';
				isPublished = Boolean(article!.published);
				coverImage = article!.cover_image ?? '';
				isInitialized = true;
				if (slug) isSlugManuallyEdited = true;
			});
		}
	});

	// Slug 自动生成逻辑
	function handleSlugInput() {
		isSlugManuallyEdited = true;
	}

	$effect(() => {
		// 如果没有手动编辑，且有标题，则根据标题自动生成拼音 slug
		if (!isSlugManuallyEdited && title) {
			slug = pinyin(title, { toneType: 'none' })
				.toLowerCase()
				.replace(/[^a-z0-9]/g, '') // 移除所有非字母数字字符（包括空格和连字符）
				.slice(0, 50); // 限制长度
		}
	});

	async function handleImageUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		if (!target.files || target.files.length === 0) return;

		try {
			isUploading = true;
			const file = target.files[0];
			const url = await uploadImage(file);

			// 预加载图片，确保显示时已经是下载好的状态
			await new Promise((resolve, reject) => {
				const img = new Image();
				img.onload = resolve;
				img.onerror = reject;
				img.src = url;
			});

			coverImage = url;
		} catch (error: unknown) {
			notify.error(error);
		} finally {
			isUploading = false;
		}
	}

	async function handleSubmit() {
		errors = {};
		const fieldErrors: Record<string, string> = {};

		if (!title.trim()) {
			errors.title = '标题不能为空';
			fieldErrors['标题'] = '不能为空';
		}
		if (!slug.trim()) {
			errors.slug = 'Slug 不能为空';
			fieldErrors['Slug'] = '不能为空';
		}
		if (!categoryName.trim()) {
			errors.category = '分类不能为空';
			fieldErrors['分类'] = '不能为空';
		}

		if (Object.keys(fieldErrors).length) {
			notify.validation(fieldErrors);
			return;
		}

		// 校验 Slug 是否重复
		const { data: existing, error: checkError } = await supabase
			.from('articles')
			.select('id')
			.eq('slug', slug)
			.is('deleted_at', null)
			.maybeSingle();

		if (checkError) {
			notify.error('校验 Slug 唯一性失败');
			return;
		}

		if (existing && existing.id !== (article as any)?.id) {
			errors.slug = '该 Slug 已被占用';
			notify.error('该 Slug 已被占用，请修改');
			return;
		}

		// 查找分类 ID
		const existingCat = categories.find((c) => c.name === categoryName);
		if (!existingCat) {
			notify.error('请选择有效的分类');
			return;
		}

		const formData = {
			title,
			slug,
			content,
			excerpt,
			category: categoryName,
			category_id: existingCat.id,
			tags,
			published: isPublished,
			cover_image: coverImage
		};

		await onSave(formData);
	}

	function handleTagKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			const input = e.target as HTMLInputElement;
			const val = input.value.trim();
			if (val && !tags.includes(val)) {
				tags = [...tags, val];
				input.value = '';
			}
		}
	}

	function removeTag(tagToRemove: string) {
		tags = tags.filter((t) => t !== tagToRemove);
	}
</script>

<div class="w-full mx-auto px-4 py-3">
	<!-- 返回链接 -->
	<div class="mb-1.5 text-slate-500">
		<a
			href={resolve('/admin/articles')}
			class="inline-flex items-center gap-2 text-sm hover:text-slate-900 transition-colors"
		>
			<ArrowLeft size={16} />
			<span>返回文章列表</span>
		</a>
	</div>

	<div class="flex flex-col lg:flex-row gap-5">
		<div class="flex-1 min-w-0 space-y-3">
			<!-- 标题部分 -->
			<div class="space-y-1">
				<input
					type="text"
					bind:value={title}
					placeholder="输入文章标题..."
					class="w-full text-2xl lg:text-3xl font-bold text-slate-900 placeholder:text-slate-200 bg-transparent border-none outline-none focus:ring-0 p-0 leading-tight tracking-tight"
				/>
				{#if errors.title}
					<p class="text-xs text-rose-500 font-medium">{errors.title}</p>
				{/if}

				<div class="flex items-center gap-2 text-xs font-mono text-slate-400">
					<span class="text-slate-300">/</span>
					<span class="text-slate-500">文章</span>
					<span class="text-slate-300">/</span>
					<input
						type="text"
						bind:value={slug}
						oninput={() => (isSlugManuallyEdited = true)}
						placeholder="url-slug"
						class="bg-transparent border-none outline-none focus:ring-0 p-0 text-slate-600 truncate max-w-md placeholder:text-slate-300"
					/>
					{#if errors.slug}
						<span class="ml-2 text-rose-500 font-sans">{errors.slug}</span>
					{/if}
				</div>
			</div>

			<!-- 编辑器部分 -->
			<div>
				<Editor bind:value={content} placeholder="# 开始创作...\n\n支持 Markdown 语法" />
			</div>
		</div>

		<!-- 侧边栏 -->
		<div class="w-full lg:w-64 flex-shrink-0 space-y-4 pt-1">
			<!-- 保存按钮 -->
			<button
				onclick={handleSubmit}
				disabled={isSaving}
				class="w-full h-10 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow"
			>
				{#if isSaving}
					<div
						class="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white"
					></div>
					<span>保存中...</span>
				{:else}
					<Save size={16} />
					<span>保存文章</span>
				{/if}
			</button>

			<!-- 发布开关 -->
			<div class="flex items-center justify-between py-1 border-b border-slate-100">
				<span class="text-xs font-bold text-slate-600 uppercase tracking-widest">发布状态</span>
				<button
					onclick={() => (isPublished = !isPublished)}
					class="relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
					class:bg-slate-900={isPublished}
					class:bg-slate-200={!isPublished}
					aria-label="切换发布状态"
				>
					<span
						class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
						class:translate-x-4={isPublished}
					></span>
				</button>
			</div>

			<!-- 封面图片 -->
			<div class="space-y-1.5">
				<h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest">封面图片</h3>
				<input
					type="file"
					accept="image/*"
					class="hidden"
					bind:this={fileInput}
					onchange={handleImageUpload}
				/>
				<button
					onclick={() => fileInput?.click()}
					disabled={isUploading}
					class="w-full aspect-video bg-white border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer group overflow-hidden relative"
				>
					{#if isUploading}
						<div
							class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm transition-all"
						>
							<div
								class="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-2"
							></div>
							<span class="text-xs font-bold text-slate-900">正在上传...</span>
						</div>
					{/if}

					{#if coverImage}
						<img
							src={coverImage}
							alt="封面预览"
							class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
						/>
						<div
							class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold backdrop-blur-sm"
						>
							更换图片
						</div>
					{:else}
						<ImageIcon
							size={24}
							class="mb-2 opacity-50 group-hover:scale-110 transition-transform"
						/>
						<span class="text-xs font-bold">点击上传封面</span>
					{/if}
				</button>
			</div>

			<!-- 元数据 -->
			<div class="space-y-3">
				<h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest">元数据</h3>

				<div class="space-y-1">
					<label
						for="category"
						class="block text-xs font-bold text-slate-500 uppercase tracking-widest">分类</label
					>
					<div class="relative">
						<select
							id="category"
							bind:value={categoryName}
							class="w-full appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-700 outline-none transition-shadow cursor-pointer hover:border-slate-300"
						>
							<option value="" disabled selected>选择分类</option>
							{#each categories as c (c.id)}
								<option value={c.name}>{c.name}</option>
							{/each}
						</select>
						<div
							class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
						>
							<svg
								width="10"
								height="6"
								viewBox="0 0 10 6"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M1 1L5 5L9 1"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</div>
					</div>
					{#if errors.category}
						<p class="text-xs text-rose-500">{errors.category}</p>
					{/if}
				</div>

				<div class="space-y-1">
					<label
						for="excerpt"
						class="block text-xs font-bold text-slate-500 uppercase tracking-widest">摘要</label
					>
					<textarea
						id="excerpt"
						bind:value={excerpt}
						rows="3"
						placeholder="简短描述..."
						class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 outline-none transition-shadow resize-none hover:border-slate-300 leading-relaxed"
					></textarea>
				</div>

				<div class="space-y-1">
					<label for="tags" class="block text-xs font-bold text-slate-500 uppercase tracking-widest"
						>标签</label
					>
					<div class="flex flex-wrap gap-1.5 mb-1.5">
						{#each tags as tag}
							<div
								class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-xs font-medium text-slate-600 border border-slate-200/50"
							>
								<span>{tag}</span>
								<button
									type="button"
									onclick={() => removeTag(tag)}
									class="text-slate-400 hover:text-rose-500 transition-colors"
									aria-label="删除标签"
								>
									<svg
										width="10"
										height="10"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="3"
										stroke-linecap="round"
										stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
									>
								</button>
							</div>
						{/each}
					</div>
					<input
						id="tags"
						type="text"
						placeholder="回车增加标签..."
						onkeydown={handleTagKeydown}
						class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-200 outline-none transition-shadow hover:border-slate-300"
					/>
				</div>
			</div>

			<!-- 根据要求移除了“更多设置”按钮 -->
		</div>
	</div>
</div>
