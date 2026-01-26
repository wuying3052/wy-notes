<script lang="ts">
	import { UserCheck, UserX, ArrowUpRight, ArrowDownRight } from 'lucide-svelte';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { notify } from '$lib/feedback/notify';
	import { page } from '$app/stores';

	type UserData = {
		user_id: string;
		email: string;
		display_name: string;
		role: string;
		status: string;
		created_at: string;
		avatar_url?: string;
	};

	let { data }: { data: PageData } = $props();
	let users = $derived(data.users as unknown as UserData[]);
	let myUserId = $derived($page.data?.me?.id ?? '');

	function statusLabel(status: string) {
		if (status === 'active') return '已激活';
		if (status === 'pending') return '待审核';
		if (status === 'suspended') return '已冻结';
		return status;
	}
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-slate-900">用户管理</h1>
			<p class="text-slate-500 mt-1 text-sm">审核申请、冻结账号、管理管理员权限。</p>
		</div>
		<!-- Optional: Add Search or Actions here -->
	</div>

	<!-- Table -->
	<div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-left border-collapse">
				<thead>
					<tr
						class="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold"
					>
						<th class="px-6 py-4 w-1/3">用户</th>
						<th class="px-6 py-4">状态</th>
						<th class="px-6 py-4">角色</th>
						<th class="px-6 py-4">申请时间</th>
						<th class="px-6 py-4 text-right">操作</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each users as u (u.user_id)}
						<tr class="hover:bg-slate-50 transition-colors group">
							<td class="px-6 py-4">
								<div class="flex items-center gap-3">
									<div
										class="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold overflow-hidden text-xs"
									>
										{#if u.avatar_url}
											<img src={u.avatar_url} alt="avatar" class="w-full h-full object-cover" />
										{:else}
											<div
												class="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400"
											>
												<span class="text-[10px] font-bold"
													>{(u.display_name || u.email || 'U').slice(0, 1).toUpperCase()}</span
												>
											</div>
										{/if}
									</div>
									<div class="min-w-0">
										<div class="font-bold text-slate-900 text-sm truncate">
											{u.display_name || u.email || u.user_id}
										</div>
										<div class="text-[10px] text-slate-500 truncate">{u.email || u.user_id}</div>
									</div>
								</div>
							</td>
							<td class="px-6 py-4">
								<span
									class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1.5"
									class:bg-emerald-50={u.status === 'active'}
									class:text-emerald-700={u.status === 'active'}
									class:border-emerald-100={u.status === 'active'}
									class:bg-amber-50={u.status === 'pending'}
									class:text-amber-700={u.status === 'pending'}
									class:border-amber-100={u.status === 'pending'}
									class:bg-red-50={u.status === 'suspended'}
									class:text-red-700={u.status === 'suspended'}
									class:border-red-100={u.status === 'suspended'}
								>
									<span
										class="w-1.5 h-1.5 rounded-full {u.status === 'active'
											? 'bg-emerald-500'
											: u.status === 'pending'
												? 'bg-amber-500'
												: 'bg-red-500'}"
									></span>
									{statusLabel(u.status)}
								</span>
							</td>
							<td class="px-6 py-4">
								<span class="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded">
									{u.role === 'super_admin'
										? '超级管理员'
										: u.role === 'admin'
											? '管理员'
											: u.role === 'creator'
												? '创作者'
												: '普通用户'}
								</span>
							</td>
							<td class="px-6 py-4 text-xs text-slate-500 font-mono">
								{new Date(u.created_at).toLocaleString('zh-CN')}
							</td>
							<td class="px-6 py-4 text-right">
								<div
									class="inline-flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
								>
									{#if data.currentUserRole === 'super_admin' || (data.currentUserRole === 'admin' && u.role !== 'admin' && u.role !== 'super_admin')}
										{#if u.status === 'pending'}
											<form
												method="POST"
												action="?/approve"
												use:enhance={() => {
													return async ({ result }) => {
														if (result.type === 'success') notify.success('已通过审核');
														else notify.error('操作失败');
													};
												}}
											>
												<input type="hidden" name="user_id" value={u.user_id} />
												<button
													class="h-7 px-2.5 rounded-md bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition-colors flex items-center"
												>
													<UserCheck size={14} class="mr-1.5" />通过
												</button>
											</form>
										{/if}

										{#if u.status !== 'suspended'}
											<form
												method="POST"
												action="?/suspend"
												use:enhance={() => {
													return async ({ result }) => {
														if (result.type === 'success') notify.success('已冻结');
														else notify.error('操作失败');
													};
												}}
											>
												<input type="hidden" name="user_id" value={u.user_id} />
												<button
													disabled={u.user_id === myUserId}
													class="h-7 px-2.5 rounded-md text-rose-600 bg-rose-50 border border-rose-100 text-xs font-medium hover:bg-rose-100 transition-colors flex items-center"
													class:opacity-70={u.user_id === myUserId}
													class:cursor-not-allowed={u.user_id === myUserId}
												>
													<UserX size={14} class="mr-1.5" />冻结
												</button>
											</form>
										{/if}
									{/if}

									{#if data.currentUserRole === 'super_admin'}
										{#if u.role !== 'admin'}
											<form
												method="POST"
												action="?/promote_admin"
												use:enhance={() => {
													return async ({ result }) => {
														if (result.type === 'success') notify.success('已提升为 admin');
														else notify.error('操作失败');
													};
												}}
											>
												<input type="hidden" name="user_id" value={u.user_id} />
												<button
													class="h-7 px-2.5 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors flex items-center"
												>
													<ArrowUpRight size={14} class="mr-1.5" />设为 admin
												</button>
											</form>
										{:else}
											<form
												method="POST"
												action="?/demote_editor"
												use:enhance={() => {
													return async ({ result }) => {
														if (result.type === 'success') notify.success('已降级为 editor');
														else notify.error('操作失败');
													};
												}}
											>
												<input type="hidden" name="user_id" value={u.user_id} />
												<button
													disabled={u.user_id === myUserId}
													class="h-7 px-2.5 rounded-md bg-white border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors flex items-center shadow-sm"
													class:opacity-70={u.user_id === myUserId}
													class:cursor-not-allowed={u.user_id === myUserId}
												>
													<ArrowDownRight size={14} class="mr-1.5" />降级
												</button>
											</form>
										{/if}
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
