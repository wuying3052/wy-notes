<script lang="ts">
	import { compressImageFile } from '$lib/utils/upload';
	import { Carta, MarkdownEditor } from 'carta-md';
	import { attachment } from '@cartamd/plugin-attachment';
	import { code } from '@cartamd/plugin-code';
	import { slash } from '@cartamd/plugin-slash';
	import { emoji } from '@cartamd/plugin-emoji';
	import { math } from '@cartamd/plugin-math';
	import {
		transformerNotationDiff,
		transformerNotationHighlight,
		transformerNotationWordHighlight
	} from '@shikijs/transformers';

	import 'carta-md/default.css';
	import '@cartamd/plugin-code/default.css';
	import '@cartamd/plugin-slash/default.css';
	import '@cartamd/plugin-emoji/default.css';
	import 'katex/dist/katex.css';

	let { value = $bindable(''), placeholder = '开始写作...' } = $props<{
		value?: string;
		placeholder?: string;
	}>();

	// Initialize Carta once.
	const carta = new Carta({
		sanitizer: false, // We trust our admins
		extensions: [
			code(),
			slash(),
			emoji(),
			math(),
			attachment({
				async upload(file: File) {
					try {
						// 1. 压缩图片
						const compressedFile = await compressImageFile(file);

						const formData = new FormData();
						formData.append('file', compressedFile);
						const response = await fetch('/api/uploads/article-image', {
							method: 'POST',
							body: formData
						});

						if (!response.ok) {
							const errorData = await response.json().catch(() => ({}));
							throw new Error(errorData.message || `Upload failed with status ${response.status}`);
						}

						const result = await response.json();
						if (result.url) return result.url;
						throw new Error('Upload failed: No URL returned from server');
					} catch (e) {
						console.error('Editor upload error:', e);
						throw e;
					}
				}
			})
		]
	});
	import { onMount } from 'svelte';
	import { notify } from '$lib/feedback/notify';

	/**
	 * 增强 Carta 预览区的代码块
	 * 添加复制按钮、语言标识等，复用前台逻辑但适配 Carta 的 DOM 结构
	 */
	function enhanceCartaCodeBlocks(container: HTMLElement) {
		const preBlocks = container.querySelectorAll('pre');
		preBlocks.forEach((preBlock) => {
			const pre = preBlock as HTMLElement;
			if (pre.parentElement?.classList.contains('code-block-wrapper')) return;

			const code = pre.querySelector('code');
			if (!code) return;

			// 尝试从多种来源获取语言：data-lang / data-language / 各类 class 前缀
			const preClasses = Array.from(pre.classList);
			const codeClasses = Array.from(code.classList);
			const allClasses = [...preClasses, ...codeClasses];

			// 尝试从多种来源获取语言
			let lang =
				code.getAttribute('data-language') ||
				code.getAttribute('data-lang') ||
				pre.getAttribute('data-language') ||
				pre.getAttribute('data-lang') ||
				allClasses.find((c) => c.startsWith('language-'))?.replace('language-', '') ||
				allClasses.find((c) => c.startsWith('lang-'))?.replace('lang-', '') ||
				allClasses.find((c) => c.startsWith('shiki-lang-'))?.replace('shiki-lang-', '') ||
				// 恢复 shiki- 匹配但排除主题相关类名
				allClasses
					.find(
						(c) =>
							c.startsWith('shiki-') &&
							!c.includes('theme') &&
							!c.includes('light') &&
							!c.includes('dark') &&
							c !== 'shiki'
					)
					?.replace('shiki-', '') ||
				'text';

			const normalized = lang.toLowerCase();
			const isText =
				normalized === 'text' ||
				normalized === 'plaintext' ||
				normalized === 'plain' ||
				normalized === 'shiki';

			const displayLang = isText ? '' : normalized.toUpperCase();

			// 1. 创建容器
			const wrapper = document.createElement('div');
			wrapper.className =
				'code-block-wrapper my-4 rounded-lg overflow-hidden bg-[#fafafa] shadow-sm border border-slate-200 group relative';

			// 2. 头部
			const header = document.createElement('div');
			header.className =
				'flex items-center justify-end px-3 py-1.5 bg-slate-50 border-b border-slate-200'; // justify-end since no label

			// 复制按钮
			const copyBtn = document.createElement('button');
			copyBtn.className =
				'text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1 text-[10px] font-medium';
			copyBtn.innerHTML = `<span>复制</span>`;
			copyBtn.onclick = async () => {
				try {
					await navigator.clipboard.writeText(code.innerText || '');
					copyBtn.innerHTML = `<span class="text-emerald-500">已复制</span>`;
					setTimeout(() => (copyBtn.innerHTML = `<span>复制</span>`), 2000);
				} catch (err) {
					notify.error('复制失败');
				}
			};

			header.appendChild(copyBtn);

			pre.parentNode?.insertBefore(wrapper, pre);
			wrapper.appendChild(header);
			wrapper.appendChild(pre);

			// 样式重置
			pre.style.margin = '0';
			pre.style.border = 'none';
			pre.style.borderRadius = '0';
			pre.style.background = 'transparent';
		});
	}

	onMount(() => {
		const wrapper = document.querySelector('.carta-wrapper');
		if (!wrapper) return;

		let debounceTimer: number;

		const observer = new MutationObserver((mutations) => {
			clearTimeout(debounceTimer);
			debounceTimer = window.setTimeout(() => {
				const renderer = wrapper.querySelector('.carta-renderer');
				if (renderer) {
					enhanceCartaCodeBlocks(renderer as HTMLElement);
				}
			}, 300); // 300ms debounce
		});

		observer.observe(wrapper, { childList: true, subtree: true });

		return () => {
			clearTimeout(debounceTimer);
			observer.disconnect();
		};
	});
</script>

<div
	class="carta-wrapper group w-full rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-100"
>
	<MarkdownEditor {carta} bind:value mode="tabs" theme="github" {placeholder} />
</div>

<style>
	/* UI/UX Pro Max Refactor for Carta Editor */

	/* Global Variables Mapping (Slate Scale) */
	:global(.carta-wrapper) {
		/* Colors */
		--c-slate-50: #f8fafc;
		--c-slate-100: #f1f5f9;
		--c-slate-200: #e2e8f0;
		--c-slate-300: #cbd5e1;
		--c-slate-400: #94a3b8;
		--c-slate-500: #64748b;
		--c-slate-600: #475569;
		--c-slate-700: #334155;
		--c-slate-800: #1e293b;
		--c-slate-900: #0f172a;
		--c-primary: var(--c-slate-900);

		/* Fonts */
		--carta-font-code: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
		--carta-font-general: 'Inter', system-ui, -apple-system, sans-serif;

		/* Layout */
		height: calc(100vh - 180px); /* Increased from 280px to fill more space */
		min-height: 500px;
		display: flex;
		flex-direction: column;
		overflow: hidden; /* Important for internal scrolling */
	}

	:global(.carta-editor) {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	:global(.carta-container) {
		flex: 1;
		overflow: hidden;
		display: flex;
	}

	:global(.carta-input),
	:global(.carta-renderer) {
		overflow-y: auto !important;
		height: 100% !important;
		padding: 16px 24px !important; /* Reduced from 24px 32px */
		font-family: var(--carta-font-general) !important;
	}

	/* 1. Toolbar - The "Header" */
	:global(.carta-toolbar) {
		background-color: white !important;
		border-bottom: 1px solid var(--c-slate-200) !important;
		padding: 8px 12px !important; /* Compact padding */
		min-height: 48px !important;
		display: flex !important;
		align-items: center !important;
		gap: 6px !important;
		position: sticky !important;
		top: 0 !important;
		z-index: 10 !important;
		border-radius: 12px 12px 0 0 !important;
	}

	/* Toolbar Buttons (Tabs/Split) */
	:global(.carta-toolbar-left button) {
		font-family: var(--carta-font-general) !important;
		font-size: 0.825rem !important; /* Smaller text */
		font-weight: 500 !important;
		color: var(--c-slate-500) !important;
		padding: 4px 10px !important;
		border-radius: 6px !important;
		border: 1px solid transparent !important;
		transition: all 0.2s ease !important;
		background: transparent !important;
	}

	:global(.carta-toolbar-left button:hover) {
		color: var(--c-slate-900) !important;
		background-color: var(--c-slate-50) !important;
	}

	:global(.carta-toolbar-left button.carta-active) {
		color: var(--c-slate-900) !important;
		background-color: var(--c-slate-100) !important;
		font-weight: 600 !important;
	}

	/* Toolbar Icons */
	:global(.carta-icon),
	:global(.carta-icon-full) {
		color: var(--c-slate-500) !important;
		width: 28px !important; /* Smaller icons */
		height: 28px !important;
		padding: 5px !important;
		border-radius: 4px !important;
		transition: all 0.2s ease !important;
		cursor: pointer !important;
		display: flex !important;
		align-items: center !important;
		justify-content: center !important;
	}

	:global(.carta-icon svg),
	:global(.carta-icon-full svg) {
		stroke-width: 2px !important;
		width: 16px !important;
		height: 16px !important;
	}

	:global(.carta-icon:hover),
	:global(.carta-icon-full:hover) {
		color: var(--c-slate-900) !important;
		background-color: var(--c-slate-100) !important;
		transform: translateY(-1px); /* Subtle feedback */
	}

	/* 2. Editor & Input Area */
	:global(.carta-container) {
		flex: 1;
		background-color: white !important;
	}

	:global(.carta-input),
	:global(.carta-renderer) {
		padding: 24px 32px !important; /* Compact spacing */
		font-family: var(--carta-font-general) !important;
	}

	/* The Code Input */
	:global(.carta-font-code) {
		font-family: var(--carta-font-code) !important;
		font-size: 0.9rem !important; /* Readable code size */
		line-height: 1.6 !important;
		color: var(--c-slate-800) !important;
	}

	/* Placeholder */
	:global(.carta-input textarea::placeholder) {
		color: var(--c-slate-300) !important;
		font-weight: 400 !important;
	}

	/* Selection */
	:global(.carta-input textarea::selection) {
		background-color: #e0f2fe !important; /* Sky 100 */
		color: var(--c-slate-900) !important;
	}

	/* 3. Preview Typography (Prose-like) */
	:global(.carta-renderer) {
		color: var(--c-slate-700); /* Removed !important to let syntax highlighting shine */
		line-height: 1.7 !important; /* Elegant reading height */
		max-width: none !important; /* Allow full width */
	}

	:global(.carta-renderer h1) {
		font-size: 1.8em !important; /* Smaller headings */
		font-weight: 700 !important;
		color: var(--c-slate-900) !important;
		letter-spacing: -0.025em !important;
		margin-top: 0 !important;
		margin-bottom: 0.6em !important;
		line-height: 1.1 !important;
	}

	:global(.carta-renderer h2) {
		font-size: 1.4em !important;
		font-weight: 600 !important;
		color: var(--c-slate-800) !important;
		margin-top: 1.25em !important;
		margin-bottom: 0.6em !important;
		letter-spacing: -0.025em !important;
	}

	:global(.carta-renderer h3) {
		font-size: 1.15em !important;
		font-weight: 600 !important;
		color: var(--c-slate-800) !important;
		margin-top: 1em !important;
		margin-bottom: 0.5em !important;
	}

	:global(.carta-renderer p) {
		margin-bottom: 1em !important;
	}

	:global(.carta-renderer ul),
	:global(.carta-renderer ol) {
		margin-bottom: 1em !important;
		padding-left: 1.25em !important;
	}

	:global(.carta-renderer li) {
		margin-bottom: 0.25em !important;
		position: relative;
	}

	:global(.carta-renderer strong) {
		font-weight: 600 !important;
		color: var(--c-slate-900) !important;
	}

	:global(.carta-renderer blockquote) {
		font-style: italic !important;
		color: var(--c-slate-500) !important;
		border-left: 3px solid var(--c-slate-200) !important;
		padding-left: 1em !important;
		margin: 1.25em 0 !important;
	}

	/* Inline code only - NOT pre code */
	:global(.carta-renderer :not(pre) > code) {
		font-family: var(--carta-font-code) !important;
		font-size: 0.85em !important;
		background-color: var(--c-slate-100) !important;
		padding: 0.2em 0.4em !important;
		border-radius: 4px !important;
		color: var(--c-slate-800) !important;
	}

	:global(.carta-renderer pre) {
		/* background-color: #f8fafc !important;  Moved to wrapper bg */
		background-color: transparent !important;
		padding: 1rem !important;
		border-radius: 0 !important; /* Wrapper has radius */
		overflow-x: auto !important;
		margin: 0 !important; /* Wrapper handles margin */
		border: none !important; /* Wrapper handles border */
	}

	:global(.carta-renderer pre code) {
		background-color: transparent !important;
		/* color: var(--c-slate-600) !important; REMOVED: Kills syntax highlighting */
		padding: 0 !important;
		font-size: 0.85rem !important;
		font-family: var(--carta-font-code) !important;
	}

	/* Scrollbars */
	:global(::-webkit-scrollbar) {
		width: 8px;
		height: 8px;
	}

	:global(::-webkit-scrollbar-track) {
		background: transparent;
	}

	:global(::-webkit-scrollbar-thumb) {
		background: var(--c-slate-200);
		border-radius: 4px;
		border: 2px solid white; /* Padding effect */
	}

	:global(::-webkit-scrollbar-thumb:hover) {
		background: var(--c-slate-400);
	}
</style>
