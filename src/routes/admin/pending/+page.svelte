<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { notify } from '$lib/feedback/notify';

	let loading = $state(false);

	async function logout() {
		loading = true;
		try {
			await supabase.auth.signOut();
			await goto(resolve('/login'));
		} catch (e) {
			notify.error(e);
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-[70vh] flex items-center justify-center p-6">
	<div
		class="w-full max-w-lg bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl p-6"
	>
		<h1 class="text-xl font-bold text-slate-900">账号正在审核</h1>
		<p class="mt-2 text-sm leading-6 text-slate-600">
			你的账号已提交注册申请，但尚未通过审核。审核通过后即可登录后台并成为作者。
		</p>
		<p class="mt-3 text-sm leading-6 text-slate-600">如长时间未通过，请联系网站管理员。</p>
		<div class="mt-6 flex items-center justify-end gap-2">
			<button
				onclick={logout}
				disabled={loading}
				class="h-9 rounded-lg px-3 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
			>
				{loading ? '处理中...' : '退出登录'}
			</button>
		</div>
	</div>
</div>
