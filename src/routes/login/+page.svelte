<script lang="ts">
	import { Lock, Mail, Github, LogIn, Sparkles, TrendingUp, Shield, Zap } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import { resolve } from '$app/paths';
	import logo from '$lib/assets/image/wy-notes-logo.webp';
	import { notify } from '$lib/feedback/notify';
	import { page } from '$app/stores';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);

	import { supabase } from '$lib/supabase';
	import { goto, invalidateAll } from '$app/navigation';

	async function handleLogin(e: Event) {
		e.preventDefault();
		if (!email || !password) {
			const fieldErrors: Record<string, string> = {};
			if (!email) fieldErrors['邮箱'] = '不能为空';
			if (!password) fieldErrors['密码'] = '不能为空';
			notify.validation(fieldErrors);
			return;
		}
		loading = true;

		try {
			const { error } = await supabase.auth.signInWithPassword({
				email,
				password
			});

			if (error) throw error;

			notify.success('toast.login_success');

			// 强制刷新所有 Load 函数以同步登录状态
			await invalidateAll();

			// 获取跳转路径，优先 URL 参数，其次首页
			const redirectTo = $page.url.searchParams.get('redirectTo') || '/';
			await goto(resolve(redirectTo));
		} catch (error) {
			notify.error(error);
		} finally {
			loading = false;
		}
	}

	const features = [
		{ icon: Sparkles, text: '现代化管理界面' },
		{ icon: TrendingUp, text: '实时数据分析' },
		{ icon: Shield, text: '安全可靠' },
		{ icon: Zap, text: '快速响应' }
	];
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
				<h1 class="text-5xl font-bold text-slate-900 mb-6 leading-tight">
					欢迎登录<br />WY NOTES
				</h1>
				<p class="text-xl text-slate-600 leading-relaxed">
					发现有趣的篇章，记录知识的火花。基于 Svelte 5 和 Supabase 构建。
				</p>
			</div>
		</div>

		<div class="relative z-10 grid grid-cols-2 gap-6">
			{#each features as feature (feature.text)}
				<Card.Root class="border-white/20 hover:shadow-lg transition-all">
					<Card.Content class="p-4 flex items-center space-x-3">
						<div class="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
							<feature.icon size={22} class="text-brand" />
						</div>
						<span class="font-medium text-slate-700">{feature.text}</span>
					</Card.Content>
				</Card.Root>
			{/each}
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

					<Card.Title class="text-3xl text-center lg:text-left">用户登录</Card.Title>
					<Card.Description class="text-center lg:text-left"
						>登录您的账户以访问更多功能</Card.Description
					>
				</Card.Header>

				<Card.Content class="space-y-4">
					<form onsubmit={handleLogin} class="space-y-4">
						<div class="space-y-2">
							<Label for="email">邮箱地址</Label>
							<div class="relative">
								<Mail class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
								<Input
									type="email"
									id="email"
									bind:value={email}
									required
									placeholder="admin@example.com"
									class="pl-10"
								/>
							</div>
						</div>

						<div class="space-y-2">
							<Label for="password">登录密码</Label>
							<div class="relative">
								<Lock class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
								<Input
									type="password"
									id="password"
									bind:value={password}
									required
									placeholder="••••••••"
									class="pl-10"
								/>
							</div>
						</div>

						<Button
							type="submit"
							disabled={loading}
							class="w-full bg-blue-600 hover:bg-blue-700 hover:shadow-lg transition-colors"
						>
							{#if loading}
								<span
									class="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"
								></span>
							{:else}
								<LogIn size={20} class="mr-2" />
								<span>即刻进入</span>
							{/if}
						</Button>
					</form>

					<div class="relative">
						<div class="absolute inset-0 flex items-center">
							<Separator class="w-full" />
						</div>
						<div class="relative flex justify-center text-xs uppercase">
							<span class="bg-white px-2 text-slate-500">没有账号？</span>
						</div>
					</div>

					<a
						href={resolve('/admin/register')}
						class="w-full inline-flex items-center justify-center h-10 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium transition-colors"
					>
						申请成为作者
					</a>

					<div class="relative">
						<Separator class="my-4" />
						<span
							class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-slate-400 uppercase"
						>
							第三方登录
						</span>
					</div>

					<Button variant="outline" class="w-full">
						<Github size={20} class="mr-2" />
						<span>GitHub 账号登录</span>
					</Button>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>
