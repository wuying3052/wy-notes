<script lang="ts">
	import { onMount } from 'svelte';
	import { ChevronUp } from 'lucide-svelte';
	import { fade, scale } from 'svelte/transition';

	let show = false;

	onMount(() => {
		const handleScroll = () => {
			show = window.scrollY > 400;
		};
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

{#if show}
	<button
		on:click={scrollToTop}
		transition:scale={{ duration: 200 }}
		class="fixed bottom-8 right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:bg-blue-700 hover:scale-110 active:scale-95"
		aria-label="Back to top"
	>
		<ChevronUp class="h-6 w-6" />
	</button>
{/if}
