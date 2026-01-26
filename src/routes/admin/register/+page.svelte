<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { Sparkles, UserPlus } from 'lucide-svelte';
	import { supabase } from '$lib/supabase';
	import { notify } from '$lib/feedback/notify';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import logo from '$lib/assets/image/wy-notes-logo.webp';

	let email = $state('');
	let password = $state('');
	let displayName = $state('');
	let loading = $state(false);

	async function handleRegister(e: Event) {
		e.preventDefault();

		const fieldErrors: Record<string, string> = {};
		if (!displayName) fieldErrors['昵称'] = '不能为空';
		if (!email) fieldErrors['邮箱'] = '不能为空';
		if (!password) fieldErrors['密码'] = '不能为空';
		if (Object.keys(fieldErrors).length) {
			notify.validation(fieldErrors);
			return;
		}

		loading = true;
		try {
			const { error } = await supabase.auth.signUp({
				email,
				password,
				options: { data: { name: displayName } }
			});

			if (error) throw error;

			notify.success('申请已提交，请等待审核');
			await goto(resolve('/admin/pending'));
		} catch (error) {
			notify.error(error);
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen flex aurora-bg">
	<div class="hidden lg:flex lg:w-[60%] p-12 flex-col justify-between relative overflow-hidden">
		<div class="absolute inset-0 opacity-20">
			<div class="absolute top-20 left-20 w-72 h-72 bg-brand/30 rounded-full blur-3xl"></div>
			<div class="absolute bottom-20 right-20 w-96 h-96 bg-sky-500/25 rounded-full blur-3xl"></div>
		</div>

		<div class="relative z-10">
			<div class="flex items-center space-x-3 mb-20">
				<img src={logo} alt="WY NOTES" class="w-12 h-12 rounded-2xl shadow-lg" />
				<span class="text-2xl font-bold text-slate-900">WY NOTES</span>
			</div>

			<div class="max-w-lg">
				<h1 class="text-5xl font-bold text-slate-900 mb-6 leading-tight">申请成为作者</h1>
				<p class="text-xl text-slate-600 leading-relaxed">
					注册后将进入审核流程。审核通过后即可登录后台发布文章与项目。
				</p>
			</div>
		</div>

		<div class="relative z-10">
			<Card.Root class="border-white/20 hover:shadow-lg transition-all">
				<Card.Content class="p-4 flex items-center space-x-3">
					<div class="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
						<UserPlus size={22} class="text-brand" />
					</div>
					<span class="font-medium text-slate-700">提交申请后等待管理员审核</span>
				</Card.Content>
			</Card.Root>
		</div>
	</div>

	<div class="flex-1 lg:w-[40%] flex items-center justify-center p-8">
		<div class="w-full max-w-md">
			<Card.Root class="border-white/20 shadow-xl">
				<Card.Header class="space-y-1">
					<div class="lg:hidden flex items-center justify-center space-x-2 mb-4">
						<div class="w-10 h-10 rounded-xl bg-brand flex items-center justify-center">
							<Sparkles size={20} class="text-white" />
						</div>
						<span class="text-xl font-bold text-brand">ADMIN</span>
					</div>

					<Card.Title class="text-3xl text-center lg:text-left">申请注册</Card.Title>
					<Card.Description class="text-center lg:text-left"
						>提交信息后进入审核流程</Card.Description
					>
				</Card.Header>

				<Card.Content class="space-y-4">
					<form onsubmit={handleRegister} class="space-y-4">
						<div class="space-y-2">
							<Label for="name">昵称</Label>
							<Input id="name" bind:value={displayName} placeholder="例如：Wang" />
						</div>
						<div class="space-y-2">
							<Label for="email">邮箱</Label>
							<Input id="email" type="email" bind:value={email} placeholder="you@example.com" />
						</div>
						<div class="space-y-2">
							<Label for="password">密码</Label>
							<Input id="password" type="password" bind:value={password} placeholder="••••••••" />
						</div>

						<Button type="submit" class="w-full" disabled={loading}>
							{loading ? '提交中...' : '提交申请'}
						</Button>
					</form>

					<div class="relative">
						<div class="absolute inset-0 flex items-center">
							<Separator class="w-full" />
						</div>
						<div class="relative flex justify-center text-xs uppercase">
							<span class="bg-white px-2 text-slate-500">已有账号？</span>
						</div>
					</div>

					<a
						href={resolve('/login')}
						class="w-full inline-flex items-center justify-center h-10 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium transition-colors"
					>
						返回登录
					</a>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>
