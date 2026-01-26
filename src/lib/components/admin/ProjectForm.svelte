<script lang="ts">
	import {
		Image as ImageIcon,
		Link as LinkIcon,
		Github,
		Calendar,
		User,
		Tag,
		Save,
		Globe,
		Eye,
		EyeOff,
		Hash,
		ArrowLeft,
		CloudUpload
	} from 'lucide-svelte';
	import { notify } from '$lib/feedback/notify';
	import { resolve } from '$app/paths';
	import { uploadImage } from '$lib/utils/upload';
	import { pinyin } from 'pinyin-pro';
	import { supabase } from '$lib/supabase';

	interface Project {
		id?: string;
		title: string;
		slug: string;
		description: string;
		long_description: string;
		cover_image: string;
		tags: string[];
		demo_url: string;
		repo_url: string;
		year: number;
		published: boolean;
		display_order: number;
		client: string;
	}

	let {
		project = $bindable(),
		isSaving = false,
		onSave
	} = $props<{
		project: Project;
		isSaving: boolean;
		onSave: (data: Project) => void;
	}>();

	let tagInput = $state('');
	let isUploading = $state(false);
	let fileInput = $state<HTMLInputElement>();
	let isSlugManuallyEdited = $state(false);

	function addTag() {
		const tag = tagInput.trim();
		if (tag && !project.tags.includes(tag)) {
			project.tags = [...project.tags, tag];
			tagInput = '';
		}
	}

	function removeTag(tagToRemove: string) {
		project.tags = project.tags.filter((t: string) => t !== tagToRemove);
	}

	function handleTitleInput() {
		if (!isSlugManuallyEdited && project.title) {
			project.slug = pinyin(project.title, { toneType: 'none' })
				.toLowerCase()
				.replace(/[^a-z0-9]/g, '') // 移除所有非字母数字字符（包括空格和连字符）
				.slice(0, 50); // 限制长度
		}
	}

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

			project.cover_image = url;
			notify.success('图片上传成功');
		} catch (error: unknown) {
			notify.error(error);
		} finally {
			isUploading = false;
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();

		// 校验 Slug 是否重复
		const { data: existing, error: checkError } = await supabase
			.from('projects')
			.select('id')
			.eq('slug', project.slug)
			.is('deleted_at', null)
			.maybeSingle();

		if (checkError) {
			notify.error('校验 Slug 唯一性失败');
			return;
		}

		if (existing && existing.id !== project.id) {
			notify.error('该 Slug 已被占用，请修改');
			return;
		}

		onSave(project);
	}
</script>

<form onsubmit={handleSubmit} class="w-full mx-auto px-4 py-3">
	<!-- Top Navigation -->
	<div class="mb-4 text-slate-500">
		<a
			href={resolve('/admin/projects')}
			class="inline-flex items-center gap-2 text-sm hover:text-slate-900 transition-colors"
		>
			<ArrowLeft size={16} />
			<span>返回项目列表</span>
		</a>
	</div>

	<div class="flex flex-col lg:flex-row gap-8">
		<!-- Left Main Content Area -->
		<div class="flex-1 min-w-0 space-y-8">
			<!-- Big Title Input -->
			<div class="space-y-2">
				<input
					type="text"
					bind:value={project.title}
					oninput={handleTitleInput}
					placeholder="输入项目名称..."
					class="w-full text-3xl lg:text-4xl font-bold text-slate-900 placeholder:text-slate-200 bg-transparent border-none outline-none focus:ring-0 p-0 leading-tight tracking-tight"
					required
				/>
				<div class="flex items-center gap-3 text-sm font-mono text-slate-400 pl-0.5">
					<span class="text-slate-300">/</span>
					<span class="text-slate-500">项目</span>
					<span class="text-slate-300">/</span>
					<input
						type="text"
						bind:value={project.slug}
						oninput={() => (isSlugManuallyEdited = true)}
						class="bg-transparent border-none outline-none focus:ring-0 p-0 text-slate-600 truncate max-w-md placeholder:text-slate-300"
						placeholder="url-slug"
					/>
				</div>
			</div>

			<!-- Descriptions -->
			<div class="space-y-6">
				<div class="space-y-2">
					<label
						for="description"
						class="text-xs font-bold text-slate-400 uppercase tracking-widest pl-0.5"
					>
						一句短评 (Excerpt)
					</label>
					<input
						id="description"
						type="text"
						bind:value={project.description}
						placeholder="用简短的语言概括项目核心价值"
						class="w-full px-0 py-2 bg-transparent border-b border-slate-100 focus:border-slate-900 outline-none transition-colors text-slate-700"
					/>
				</div>

				<div class="space-y-2">
					<label
						for="long_description"
						class="text-xs font-bold text-slate-400 uppercase tracking-widest pl-0.5"
					>
						项目详情 (Long Description)
					</label>
					<textarea
						id="long_description"
						bind:value={project.long_description}
						placeholder="详细介绍项目的背景、挑战、解决方案及你在其中的角色..."
						rows="15"
						class="w-full bg-slate-50/50 border border-slate-200/60 rounded-2xl px-5 py-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white outline-none transition-all resize-none leading-relaxed"
					></textarea>
				</div>
			</div>

			<!-- External Links Section -->
			<div class="pt-4 border-t border-slate-100">
				<h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">关联链接</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="space-y-2 group">
						<label
							for="demo_url"
							class="text-xs font-bold text-slate-500 flex items-center gap-2 group-focus-within:text-sky-600 transition-colors"
						>
							<Globe size={14} />
							Demo 展示
						</label>
						<input
							id="demo_url"
							type="url"
							bind:value={project.demo_url}
							placeholder="https://..."
							class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-sky-500 outline-none transition-all text-sm"
						/>
					</div>
					<div class="space-y-2 group">
						<label
							for="repo_url"
							class="text-xs font-bold text-slate-500 flex items-center gap-2 group-focus-within:text-slate-900 transition-colors"
						>
							<Github size={14} />
							代码仓库
						</label>
						<input
							id="repo_url"
							type="url"
							bind:value={project.repo_url}
							placeholder="https://github.com/..."
							class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-slate-900 outline-none transition-all text-sm"
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- Right Sidebar (Metadata) -->
		<div class="w-full lg:w-72 flex-shrink-0 space-y-6">
			<!-- Action Panel -->
			<div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
				<button
					type="submit"
					disabled={isSaving}
					class="w-full h-11 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-slate-900/10 active:scale-[0.98]"
				>
					{#if isSaving}
						<div
							class="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"
						></div>
						<span>保存中...</span>
					{:else}
						<Save size={18} />
						<span>保存更改</span>
					{/if}
				</button>

				<div class="flex items-center justify-between py-1 px-1 border-t border-slate-50 pt-3">
					<span class="text-xs font-bold text-slate-500 uppercase tracking-widest">公开展示</span>
					<button
						type="button"
						onclick={() => (project.published = !project.published)}
						class="relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none"
						class:bg-emerald-500={project.published}
						class:bg-slate-200={!project.published}
						aria-label="切换项目发布状态"
					>
						<span
							class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
							class:translate-x-4={project.published}
						></span>
					</button>
				</div>
			</div>

			<!-- Cover Image Section -->
			<div class="space-y-2.5">
				<h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">项目封面</h3>
				<input
					type="file"
					accept="image/*"
					class="hidden"
					bind:this={fileInput}
					onchange={handleImageUpload}
				/>
				<div
					class="group relative aspect-[4/3] bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden cursor-pointer hover:border-slate-400 transition-all"
				>
					{#if isUploading}
						<div
							class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-white/80 backdrop-blur-sm transition-all"
						>
							<div
								class="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"
							></div>
							<span class="text-[10px] font-bold text-slate-500">上传中...</span>
						</div>
					{/if}

					{#if project.cover_image}
						<img
							src={project.cover_image}
							alt="Preview"
							class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
						/>
						<div
							class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white backdrop-blur-[2px]"
						>
							<CloudUpload size={24} />
							<span class="text-xs font-bold">更换封面</span>
						</div>
					{:else}
						<button
							type="button"
							onclick={() => fileInput?.click()}
							class="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400"
							aria-label="上传并更换封面图片"
						>
							<ImageIcon size={32} class="opacity-30 group-hover:scale-110 transition-transform" />
							<span class="text-[10px] font-bold uppercase tracking-wider">上传图片</span>
						</button>
					{/if}
					<!-- URL fallback input (hidden by default, shown on hover/click if preferred) -->
					<button
						type="button"
						onclick={() => fileInput?.click()}
						class="absolute inset-0 w-full h-full z-10"
						title="点击上传图片封面"
						aria-label="上传资源封面图"
					></button>
				</div>
				<div class="px-1">
					<input
						type="text"
						bind:value={project.cover_image}
						placeholder="或粘贴图片直连地址..."
						class="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-[10px] text-slate-400 placeholder:text-slate-300 italic truncate"
					/>
				</div>
			</div>

			<!-- Project Metadata -->
			<div class="space-y-4 pt-2">
				<h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">项目元数据</h3>

				<div class="space-y-1">
					<label
						for="client"
						class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1"
						>客户 / 所属</label
					>
					<div class="relative group">
						<User
							size={14}
							class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-600"
						/>
						<input
							id="client"
							type="text"
							bind:value={project.client}
							placeholder="例如: 个人项目"
							class="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:border-slate-900 outline-none transition-all"
						/>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div class="space-y-1">
						<label
							for="year"
							class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1"
							>项目年份</label
						>
						<div class="relative group">
							<Calendar size={14} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
							<input
								id="year"
								type="number"
								bind:value={project.year}
								class="w-full pl-9 pr-2 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none"
							/>
						</div>
					</div>
					<div class="space-y-1">
						<label
							for="order"
							class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1"
							>展示排序</label
						>
						<div class="relative group">
							<Hash size={14} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
							<input
								id="order"
								type="number"
								bind:value={project.display_order}
								class="w-full pl-9 pr-2 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none"
							/>
						</div>
					</div>
				</div>

				<!-- Tags Section -->
				<div class="space-y-2">
					<label
						for="tag-input"
						class="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1"
						>技术栈 / 标签</label
					>
					<div class="flex flex-wrap gap-1.5 mb-2 px-0.5">
						{#each project.tags as tag}
							<div
								class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600 border border-slate-200/50"
							>
								<span>{tag}</span>
								<button
									type="button"
									onclick={() => removeTag(tag)}
									class="text-slate-400 hover:text-rose-500 transition-colors"
									aria-label="删除标签 {tag}"
								>
									&times;
								</button>
							</div>
						{/each}
					</div>
					<div class="relative group">
						<Tag
							size={14}
							class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-600"
						/>
						<input
							id="tag-input"
							type="text"
							bind:value={tagInput}
							onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
							placeholder="添加标签按回车..."
							class="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:border-slate-900 outline-none transition-all"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
</form>

<style>
	/* Use Inter font for a cleaner look if possible, otherwise rely on theme/global styles */
	input,
	textarea {
		transition:
			border-color 0.2s ease,
			background-color 0.2s ease,
			box-shadow 0.2s ease;
	}
</style>
