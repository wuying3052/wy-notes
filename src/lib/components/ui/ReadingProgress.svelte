<script lang="ts">
	import { onMount } from 'svelte';

	let progress = 0;

	onMount(() => {
		const handleScroll = () => {
			const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
			const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
			progress = (winScroll / height) * 100;
		};
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});
</script>

<div class="fixed top-0 left-0 z-[100] h-1 w-full bg-transparent">
	<div
		class="h-full bg-gradient-to-r from-blue-400 via-primary to-indigo-600 shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-150 ease-out"
		style:width="{progress}%"
	></div>
</div>
