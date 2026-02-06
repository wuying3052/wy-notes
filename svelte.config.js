import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import markdown from './src/lib/markdown/index.js';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md'],

	// 使用自定义 markdown preprocessor
	preprocess: [markdown(), vitePreprocess()],

	kit: {
		// 使用 Vercel adapter 启用 SSR
		// 这将确保 meta 标签在服务端渲染,微信爬虫可以正确抓取
		adapter: adapter(),
		alias: {
			'@posts': 'src/posts',
			'@data': 'src/lib/data',
			'@styles': 'src/styles'
		}
	}
};

export default config;
