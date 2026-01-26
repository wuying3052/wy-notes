<script lang="ts">
	import { enhance } from '$app/forms';
	import { Loader2, X, Camera } from 'lucide-svelte';
	import { notify } from '$lib/feedback/notify';
	import { supabase } from '$lib/supabase';
	import { invalidateAll } from '$app/navigation';

	let { open = $bindable(false), profile } = $props<{
		open: boolean;
		profile: { display_name: string; avatar_url: string | null };
	}>();

	let loading = $state(false);
	let displayName = $state('');
	let avatarUrl = $state('');
	let fileInput = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (open && profile) {
			displayName = profile.display_name || '';
			avatarUrl = profile.avatar_url || '';
		}
	});

	async function handleAvatarUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		if (!target.files || target.files.length === 0) return;

		const file = target.files[0];
		loading = true;

		try {
			const fileExt = file.name.split('.').pop();
			const filePath = `${Math.random().toString(36).substring(2)}.${fileExt}`;

			const { error: uploadError } = await supabase.storage
				.from('avatars') // 确保存储桶存在
				.upload(filePath, file);

			if (uploadError) throw uploadError;

			const {
				data: { publicUrl }
			} = supabase.storage.from('avatars').getPublicUrl(filePath);

			avatarUrl = publicUrl;
			notify.success('头像上传成功');
		} catch (error) {
			console.error('Upload error:', error);
			notify.error('头像上传失败');
		} finally {
			loading = false;
		}
	}

	async function handleSubmit() {
		loading = true;
		try {
			// 虽然 SvelteKit 通常使用 form actions，但这里为了即时反馈使用客户端更新
			// RLS 策略必须允许用户更新自己的资料
			const {
				data: { user }
			} = await supabase.auth.getUser();
			if (!user) return;

			const { error } = await supabase
				.from('profiles')
				.update({
					display_name: displayName,
					avatar_url: avatarUrl,
					updated_at: new Date().toISOString()
				})
				.eq('user_id', user.id);

			if (error) throw error;

			notify.success('个人资料已更新');
			open = false;
			invalidateAll(); // 刷新数据
		} catch (error) {
			console.error('Update profile error:', error);
			notify.error('更新失败，请重试');
		} finally {
			loading = false;
		}
	}
</script>

{#if open}
	<div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
		<button
			type="button"
			class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-default"
			aria-label="关闭弹窗"
			onclick={() => (open = false)}
		></button>

		<div
			class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
		>
			<div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
				<h2 class="text-lg font-bold text-slate-900">编辑个人资料</h2>
				<button
					onclick={() => (open = false)}
					class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
				>
					<X size={20} />
				</button>
			</div>

			<div class="p-6 space-y-6">
				<!-- 头像区域 -->
				<div class="flex flex-col items-center gap-4">
					<div class="relative group">
						<div
							class="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-md"
						>
							{#if avatarUrl}
								<img src={avatarUrl} alt="头像" class="w-full h-full object-cover" />
							{:else}
								<div class="w-full h-full flex items-center justify-center text-slate-300">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="40"
										height="40"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle
											cx="12"
											cy="7"
											r="4"
										/></svg
									>
								</div>
							{/if}
						</div>
						<button
							class="absolute bottom-0 right-0 p-2 bg-brand text-white rounded-full shadow-lg hover:bg-brand/90 transition-transform hover:scale-105 active:scale-95"
							onclick={() => fileInput?.click()}
						>
							<Camera size={16} />
						</button>
						<input
							bind:this={fileInput}
							type="file"
							accept="image/*"
							class="hidden"
							onchange={handleAvatarUpload}
						/>
					</div>
					<p class="text-xs text-slate-500">点击相机图标更换头像</p>
				</div>

				<!-- 表单区域 -->
				<div class="space-y-4">
					<div class="space-y-1.5">
						<label for="display_name" class="text-sm font-bold text-slate-700">昵称</label>
						<input
							id="display_name"
							type="text"
							bind:value={displayName}
							class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-slate-400"
							placeholder="请输入您的昵称"
						/>
					</div>
				</div>
			</div>

			<div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
				<button
					onclick={() => (open = false)}
					class="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors"
				>
					取消
				</button>
				<button
					onclick={handleSubmit}
					disabled={loading}
					class="px-5 py-2 bg-brand text-white text-sm font-bold rounded-xl shadow-lg shadow-brand/20 hover:bg-brand/90 focus:ring-2 focus:ring-offset-2 focus:ring-brand disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
				>
					{#if loading}
						<Loader2 size={16} class="animate-spin" />
					{/if}
					保存更改
				</button>
			</div>
		</div>
	</div>
{/if}
