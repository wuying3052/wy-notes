<script lang="ts">
	import { Loader2, X, Lock } from 'lucide-svelte';
	import { notify } from '$lib/feedback/notify';
	import { supabase } from '$lib/supabase';

	let { open = $bindable(false) } = $props<{
		open: boolean;
	}>();

	let loading = $state(false);
	let password = $state('');
	let confirmPassword = $state('');

	async function handleSubmit() {
		if (password.length < 6) {
			notify.error('密码长度至少需要6位');
			return;
		}
		if (password !== confirmPassword) {
			notify.error('两次输入的密码不一致');
			return;
		}

		loading = true;
		try {
			const { error } = await supabase.auth.updateUser({ password });
			if (error) throw error;

			notify.success('密码修改成功');
			open = false;
			password = '';
			confirmPassword = '';
		} catch (error) {
			console.error('Change password error:', error);
			notify.error('密码修改失败，请稍后重试');
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
			aria-label="Close modal"
			onclick={() => (open = false)}
		></button>

		<div
			class="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
		>
			<div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
				<h2 class="text-lg font-bold text-slate-900">修改密码</h2>
				<button
					onclick={() => (open = false)}
					class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
				>
					<X size={20} />
				</button>
			</div>

			<div class="p-6 space-y-5">
				<div class="p-3 bg-brand/5 text-brand rounded-xl text-xs flex items-start gap-2">
					<Lock size={14} class="shrink-0 mt-0.5" />
					<p>为了账户安全，建议使用包含字母、数字的强密码。</p>
				</div>

				<div class="space-y-4">
					<div class="space-y-1.5">
						<label for="new-password" class="text-sm font-bold text-slate-700">新密码</label>
						<input
							id="new-password"
							type="password"
							bind:value={password}
							class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-slate-400"
							placeholder="输入不少于6位的新密码"
						/>
					</div>
					<div class="space-y-1.5">
						<label for="confirm-password" class="text-sm font-bold text-slate-700">确认新密码</label
						>
						<input
							id="confirm-password"
							type="password"
							bind:value={confirmPassword}
							class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-slate-400"
							placeholder="再次输入新密码"
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
					确认修改
				</button>
			</div>
		</div>
	</div>
{/if}
