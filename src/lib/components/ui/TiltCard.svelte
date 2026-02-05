<script lang="ts">
	import { spring } from 'svelte/motion';
	import * as Card from '$lib/components/ui/card';

	let { children, class: className = '' } = $props<{
		children: any;
		class?: string;
	}>();

	const tiltX = spring(0, { stiffness: 0.1, damping: 0.25 });
	const tiltY = spring(0, { stiffness: 0.1, damping: 0.25 });
	let rafId = $state<number | null>(null);

	function handleMouseMove(e: MouseEvent) {
		// 取消之前的动画帧请求，实现防抖
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
		}

		rafId = requestAnimationFrame(() => {
			const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;
			const centerX = rect.width / 2;
			const centerY = rect.height / 2;
			tiltX.set((y - centerY) / 20);
			tiltY.set(-(x - centerX) / 20);
		});
	}

	function handleMouseLeave() {
		// 清理未完成的动画帧
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		tiltX.set(0);
		tiltY.set(0);
	}
</script>

<div
	class="h-full perspective-1000"
	role="group"
	onmousemove={handleMouseMove}
	onmouseleave={handleMouseLeave}
>
	<Card.Root
		class="relative flex h-full flex-col overflow-hidden {className} transition-shadow duration-300"
		style="transform: rotateX({$tiltX}deg) rotateY({$tiltY}deg); transform-style: preserve-3d;"
	>
		{@render children()}
	</Card.Root>
</div>

<style>
	.perspective-1000 {
		perspective: 1000px;
	}
</style>
