<script lang="ts">
	import { PanelRightClose } from 'lucide-svelte';

	interface Props {
		items: {
			id: string;
			text: string;
			depth: number;
		}[];
		onCollapse?: () => void;
	}

	let { items = [], onCollapse }: Props = $props();
</script>

<nav class="sticky top-8">
	<div class="flex items-center justify-between mb-6">
		<h4 class="text-sm font-bold text-slate-900 uppercase tracking-widest">目录</h4>
		{#if onCollapse}
			<button
				onclick={onCollapse}
				class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
				aria-label="收起目录"
			>
				<PanelRightClose size={18} />
			</button>
		{/if}
	</div>

	<ul class="space-y-3 text-sm border-l-2 border-slate-100">
		{#each items as item (item.id)}
			<li>
				<a
					href="#{item.id}"
					class="block pl-4 py-1 text-slate-500 hover:text-brand hover:border-l-2 hover:border-brand -ml-0.5 transition-all
					{item.depth === 3 ? 'pl-8 text-xs' : ''}"
				>
					{item.text}
				</a>
			</li>
		{/each}
	</ul>
</nav>
