<script lang="ts">
	import { Toaster } from 'svelte-sonner';
	import { CheckCircle2, XCircle, Info, AlertTriangle, Loader2 } from 'lucide-svelte';
</script>

<Toaster
	position="top-right"
	closeButton
	duration={4500}
	toastOptions={{
		unstyled: true,
		classes: {
			toast:
				'relative pointer-events-auto flex items-start gap-3 w-[min(380px,calc(100vw-1.5rem))] rounded-2xl border border-slate-200 bg-white shadow-xl px-4 py-3 text-slate-900 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-right-3 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-right-3',
			title: 'text-sm font-semibold leading-5',
			description: 'mt-1 text-xs leading-5 text-slate-600 whitespace-pre-line',
			closeButton:
				'absolute right-2.5 top-2.5 rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors',
			actionButton:
				'rounded-lg bg-slate-900 text-white text-xs px-3 py-1.5 hover:bg-slate-800 transition-colors',
			cancelButton:
				'rounded-lg bg-slate-100 text-slate-700 text-xs px-3 py-1.5 hover:bg-slate-200 transition-colors',
			success: 'border-l-4 border-l-emerald-500',
			error: 'border-l-4 border-l-rose-500',
			warning: 'border-l-4 border-l-amber-500',
			info: 'border-l-4 border-l-sky-500'
		}
	}}
>
	{#snippet loadingIcon()}
		<Loader2 class="h-4 w-4 animate-spin text-slate-500" />
	{/snippet}
	{#snippet successIcon()}
		<CheckCircle2 class="h-4 w-4 text-emerald-500" />
	{/snippet}
	{#snippet errorIcon()}
		<XCircle class="h-4 w-4 text-rose-500" />
	{/snippet}
	{#snippet infoIcon()}
		<Info class="h-4 w-4 text-sky-500" />
	{/snippet}
	{#snippet warningIcon()}
		<AlertTriangle class="h-4 w-4 text-amber-500" />
	{/snippet}
</Toaster>
