<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { notify } from '$lib/feedback/notify';
	import { supabase } from '$lib/supabase';
	import {
		Mail,
		Camera,
		Check,
		Lock,
		Loader2,
		Save,
		ChevronRight,
		X,
		ShieldCheck,
		Clock,
		Monitor,
		Tablet,
		Smartphone
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	let displayName = $state('');
	let avatarUrl = $state('');
	let email = $state('');
	let showPasswordModal = $state(false);
	let isUploading = $state(false);
	let fileInput: HTMLInputElement;

	$effect(() => {
		displayName = data.profile?.display_name ?? '';
		avatarUrl = data.profile?.avatar_url ?? '';
		email = data.email ?? '';
	});

	// 角色显示映射
	const roleLabels: Record<string, string> = {
		super_admin: '超级管理员',
		admin: '管理员',
		creator: '创作者',
		user: '普通用户'
	};
	let roleLabel = $derived(roleLabels[data.role ?? 'user'] ?? '普通用户');
	let roleStatusLabel = $derived(data.roleStatus === 'active' ? '正常运行' : '待审核');
	let isActive = $derived(data.roleStatus === 'active');

	// 日期格式化
	function formatDate(dateStr: string | null | undefined): string {
		if (!dateStr) return '未知';
		const d = new Date(dateStr);
		return `${d.getFullYear()} / ${String(d.getMonth() + 1).padStart(2, '0')} / ${String(d.getDate()).padStart(2, '0')}`;
	}
	let joinDate = $derived(formatDate(data.profile?.created_at));
	let lastSignIn = $derived(data.lastSignInAt ? formatDate(data.lastSignInAt) : '未登录');

	import { compressImageFile } from '$lib/utils/upload';

	// ... (other imports)

	async function handleAvatarUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		if (!target.files || target.files.length === 0) return;
		try {
			isUploading = true;
			const rawFile = target.files[0];
			// 1. 压缩图片
			const file = await compressImageFile(rawFile);

			const formData = new FormData();
			formData.set('file', file);
			const res = await fetch('/api/uploads/avatar', { method: 'POST', body: formData });
			if (!res.ok) throw new Error('操作失败');
			const payload = (await res.json()) as { publicUrl?: string };
			const newAvatarUrl = payload.publicUrl || '';

			const userId = data.me?.id;
			if (!userId) throw new Error('用户信息加载失败');

			// 3. 立即更新数据库中的 profile，防止刷新丢失
			const { error: updateError } = await supabase
				.from('profiles')
				.update({ avatar_url: newAvatarUrl })
				.eq('user_id', userId);

			if (updateError) throw updateError;

			avatarUrl = newAvatarUrl;
			notify.success('头像已更新');
		} catch (err) {
			notify.error('上传失败');
		} finally {
			isUploading = false;
		}
	}

	// 解析表单错误信息
	function formErrorMessage(result: unknown, fallback: string): string {
		if (typeof result !== 'object' || !result) return fallback;
		const r = result as { data?: { message?: string } };
		return r.data?.message ?? fallback;
	}
</script>

<div class="p-8 lg:p-12 max-w-[1700px]">
	<header class="mb-8">
		<h1 class="text-2xl font-bold text-slate-900 tracking-tight">账号设置</h1>
		<p class="text-slate-500 text-sm mt-1">
			在这里定制您的个人空间，监控账号的实时动态与安全状态。
		</p>
	</header>

	<div class="space-y-12">
		<section class="space-y-4">
			<h2 class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">个人看板</h2>

			<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-12 gap-8 items-stretch">
				<div
					class="xl:col-span-9 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col"
				>
					<form
						method="POST"
						action="?/update_profile"
						use:enhance={() => {
							return async ({ result }) => {
								if (result.type === 'success') notify.success('资料已保存');
								else notify.error('保存失败');
							};
						}}
						class="p-6 flex-1 flex flex-col"
					>
						<div class="flex gap-8 items-start flex-1">
							<!-- 增加隐藏域确保头像 URL 随表单提交 -->
							<input type="hidden" name="avatar_url" bind:value={avatarUrl} />
							<div class="shrink-0 flex flex-col items-center">
								<div class="relative group">
									<button
										type="button"
										onclick={() => fileInput?.click()}
										class="w-32 h-32 rounded-[2rem] border-4 border-slate-50 shadow-md overflow-hidden bg-slate-100 flex items-center justify-center relative transition-all hover:scale-105"
									>
										{#if avatarUrl}
											<img src={avatarUrl} alt="头像" class="w-full h-full object-cover" />
										{:else}
											<span class="text-4xl font-bold text-slate-300"
												>{(displayName || 'A').slice(0, 1).toUpperCase()}</span
											>
										{/if}
										<div
											class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
										>
											<Camera size={36} class="text-white" />
										</div>
									</button>
									<input
										type="file"
										accept="image/*"
										class="hidden"
										bind:this={fileInput}
										onchange={handleAvatarUpload}
									/>
									{#if isUploading}
										<div
											class="absolute inset-0 bg-white/70 flex items-center justify-center rounded-[2rem]"
										>
											<Loader2 size={24} class="animate-spin text-slate-900" />
										</div>
									{/if}
								</div>
								<p class="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">
									更换头像
								</p>
							</div>

							<div class="flex-1 space-y-5">
								<div class="space-y-2">
									<label for="display_name" class="text-sm font-bold text-slate-700 ml-1"
										>显示昵称</label
									>
									<input
										id="display_name"
										name="display_name"
										type="text"
										bind:value={displayName}
										class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all outline-none text-sm font-medium"
										placeholder="输入您的昵称"
									/>
								</div>

								<div class="space-y-2">
									<label for="email" class="text-sm font-bold text-slate-700 ml-1">注册邮箱</label>
									<div class="relative">
										<input
											id="email"
											type="email"
											value={email}
											disabled
											class="w-full pl-10 pr-6 py-2.5 bg-slate-100 border border-transparent rounded-2xl text-slate-500 cursor-not-allowed text-sm"
										/>
										<Mail
											size={18}
											class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
										/>
										<div
											class="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-lg border-2 border-white shadow-sm"
										>
											VERIFIED
										</div>
									</div>
								</div>
							</div>
						</div>

						<div class="mt-6 pt-6 border-t border-slate-50 flex justify-end">
							<button
								type="submit"
								class="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-sm shadow-lg shadow-slate-200 active:scale-95"
							>
								<Save size={18} /> 保存修改
							</button>
						</div>
					</form>
				</div>

				<div
					class="xl:col-span-3 bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-xl shadow-slate-200 flex flex-col justify-between"
				>
					<div>
						<div class="flex justify-between items-start mb-8">
							<div class="p-3 bg-white/10 rounded-2xl text-emerald-400 border border-white/5">
								<ShieldCheck size={24} />
							</div>
							<span
								class="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30"
							>
								安全等级：极高
							</span>
						</div>
						<h3 class="text-xl font-bold tracking-tight leading-none">账号概览</h3>
						<p class="text-slate-400 text-xs mt-2">您的身份信息与加入动态</p>
					</div>

					<div class="space-y-4 mt-6">
						<div class="flex justify-between items-end border-b border-white/10 pb-3">
							<span class="text-xs text-slate-500 font-bold">权限角色</span>
							<span class="text-sm font-bold text-emerald-400">{roleLabel}</span>
						</div>
						<div class="flex justify-between items-end border-b border-white/10 pb-3">
							<span class="text-xs text-slate-500 font-bold">入驻日期</span>
							<span class="text-sm font-medium">{joinDate}</span>
						</div>
						<div class="flex justify-between items-end border-b border-white/10 pb-3">
							<span class="text-xs text-slate-500 font-bold">当前状态</span>
							<span
								class="text-sm font-medium flex items-center gap-2"
								class:text-emerald-500={isActive}
								class:text-amber-500={!isActive}
							>
								<span
									class="w-1.5 h-1.5 rounded-full animate-pulse"
									class:bg-emerald-500={isActive}
									class:bg-amber-500={!isActive}
								></span>
								{roleStatusLabel}
							</span>
						</div>
					</div>
				</div>
			</div>
		</section>

		<section class="space-y-4">
			<h2 class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">安全与隐私</h2>
			<div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
				<div
					class="xl:col-span-9 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden hover:border-slate-400 transition-all group"
				>
					<button
						onclick={() => (showPasswordModal = true)}
						class="w-full flex items-center justify-between p-6 text-left"
					>
						<div class="flex items-center gap-6">
							<div
								class="p-4 bg-slate-50 text-slate-600 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-all duration-500"
							>
								<Lock size={24} />
							</div>
							<div>
								<h4 class="text-lg font-bold text-slate-900">修改登录密码</h4>
								<p class="text-sm text-slate-400 mt-1">
									您的账号受最高等级加密保护。建议定期更换复杂密码以维持安全。
								</p>
							</div>
						</div>
						<div class="p-2 bg-slate-50 rounded-xl group-hover:translate-x-2 transition-transform">
							<ChevronRight size={20} class="text-slate-300 group-hover:text-slate-900" />
						</div>
					</button>
				</div>
			</div>
		</section>
	</div>
</div>
<!-- Password Modal -->
{#if showPasswordModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<!-- Backdrop -->
		<button
			type="button"
			class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-default"
			aria-label="Close modal"
			onclick={() => (showPasswordModal = false)}
		></button>

		<!-- Modal Content -->
		<div
			class="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
		>
			<div
				class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50"
			>
				<h3 class="font-bold text-lg text-slate-800">修改密码</h3>
				<button
					type="button"
					onclick={() => (showPasswordModal = false)}
					class="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors"
				>
					<X size={20} />
				</button>
			</div>

			<form
				method="POST"
				action="?/change_password"
				use:enhance={() => {
					return async ({ result }) => {
						if (result.type === 'success') {
							notify.success('密码已更新');
							showPasswordModal = false;
						} else {
							notify.error(formErrorMessage(result, '保存失败'));
						}
					};
				}}
				class="p-6 space-y-4"
			>
				<div class="space-y-2">
					<label for="new_password" class="block text-sm font-medium text-slate-700">新密码</label>
					<div class="relative">
						<input
							type="password"
							name="new_password"
							placeholder="输入新密码 (至少 8 位)"
							class="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-slate-900"
						/>
						<Lock
							size={18}
							class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
						/>
					</div>
				</div>

				<div class="pt-2 flex justify-end gap-3">
					<button
						type="button"
						onclick={() => (showPasswordModal = false)}
						class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
					>
						取消
					</button>
					<button
						type="submit"
						class="px-5 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
					>
						确认修改
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
