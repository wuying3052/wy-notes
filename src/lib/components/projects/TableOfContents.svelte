<script lang="ts">
	interface Props {
		items: {
			id: string;
			text: string;
			depth: number;
		}[];
	}

	let { items = [] }: Props = $props();
</script>

<nav class="sticky top-8">
	<h4 class="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">目录</h4>
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
