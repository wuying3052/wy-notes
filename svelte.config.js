import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import markdown from './src/lib/markdown/index.js';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md'],

	// 使用自定义 markdown preprocessor
	preprocess: [markdown(), vitePreprocess()],

	kit: {
		// adapter-auto 仅支持某些环境，请参阅 https://svelte.dev/docs/kit/adapter-auto 获取列表。
		// 如果您的环境不受支持，或者您选择了特定环境，请关闭适配器。
		// 有关适配器的更多信息，请参阅 https://svelte.dev/docs/kit/adapters。
		adapter: adapter({
			// 显示默认选项。在某些平台上
			// 这些选项是自动设置的——见下文
			pages: 'build',
			assets: 'build',
			fallback: '404.html', // for SPA mode or fallback
			precompress: true,
			strict: true
		}),
		alias: {
			'@posts': 'src/posts',
			'@data': 'src/lib/data',
			'@styles': 'src/styles'
		}
	}
};

export default config;
