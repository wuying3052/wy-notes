<script lang="ts">
	import { closeConfirm, confirmState } from '$lib/feedback/confirm';

	let state = $derived($confirmState);

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') closeConfirm(false);
	}

	$effect(() => {
		if (state) document.addEventListener('keydown', onKeydown);
		return () => document.removeEventListener('keydown', onKeydown);
	});
</script>

{#if state}
	<div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
		<button
			class="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
			aria-label="Close"
			onclick={() => closeConfirm(false)}
		></button>
		<div
			class="relative w-[min(480px,calc(100vw-2rem))] rounded-2xl border border-slate-200/60 bg-white/95 shadow-xl backdrop-blur-md p-5"
		>
			<div class="text-sm font-semibold text-slate-900">{state.options.title}</div>
			{#if state.options.description}
				<div class="mt-2 text-sm leading-6 text-slate-600">{state.options.description}</div>
			{/if}
			<div class="mt-5 flex items-center justify-end gap-2">
				<button
					class="h-9 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
					onclick={() => closeConfirm(false)}
				>
					{state.options.cancelText}
				</button>
				<button
					class="h-9 rounded-lg px-3 text-sm font-medium text-white transition-colors"
					class:bg-rose-500={state.options.danger}
					class:hover:bg-rose-600={state.options.danger}
					class:bg-slate-900={!state.options.danger}
					class:hover:bg-slate-800={!state.options.danger}
					onclick={() => closeConfirm(true)}
				>
					{state.options.confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}
