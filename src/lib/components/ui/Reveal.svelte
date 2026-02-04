<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';

	let {
		children,
		threshold = 0.2,
		y = 20,
		x = 0,
		duration = 600,
		delay = 0,
		once = true
	} = $props<{
		children: any;
		threshold?: number;
		y?: number;
		x?: number;
		duration?: number;
		delay?: number;
		once?: boolean;
	}>();

	let isVisible = $state(false);
	let element: HTMLElement;

	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					isVisible = true;
					if (once) observer.unobserve(element);
				} else if (!once) {
					isVisible = false;
				}
			},
			{ threshold }
		);

		if (element) {
			observer.observe(element);
		}

		return () => observer.disconnect();
	});
</script>

<div bind:this={element} class="w-full">
	{#if isVisible}
		<div in:fly={{ y, x, duration, delay }}>
			{@render children()}
		</div>
	{:else}
		<div class="opacity-0">
			{@render children()}
		</div>
	{/if}
</div>
