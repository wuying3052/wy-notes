import { supabase } from '$lib/supabase';
import { error } from '@sveltejs/kit';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import remarkGfm from 'remark-gfm';
import rehypeStringify from 'rehype-stringify';
import rehypeSlug from 'rehype-slug';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeShiki from '@shikijs/rehype';
import GithubSlugger from 'github-slugger';
import { visit } from 'unist-util-visit';
import {
	transformerNotationDiff,
	transformerNotationHighlight,
	transformerNotationWordHighlight
} from '@shikijs/transformers';
import type { PageServerLoad } from './$types';

// 自定义 rehype 插件，用于包装代码块
function rehypeWrapCode() {
	return (tree: any) => {
		visit(tree, 'element', (node, index, parent) => {
			if (node.tagName === 'pre' && parent && parent.tagName !== 'div') {
				// 获取语言
				let lang = 'TEXT';
				if (node.properties?.['data-language']) {
					lang = node.properties['data-language'].toUpperCase();
				}

				// 创建 Wrapper
				const wrapper = {
					type: 'element',
					tagName: 'div',
					properties: {
						className: [
							'code-block-wrapper',
							'my-8',
							'rounded-xl',
							'overflow-hidden',
							'bg-[#fafafa]',
							'shadow-md',
							'ring-1',
							'ring-slate-900/5',
							'group',
							'relative'
						]
					},
					children: [
						{
							type: 'element',
							tagName: 'div',
							properties: {
								className: ['flex', 'items-center', 'justify-between', 'px-4', 'py-2', 'bg-white', 'border-b', 'border-slate-100']
							},
							children: [
								// 语言标签
								{
									type: 'element',
									tagName: 'span',
									properties: {
										className: ['text-[10px]', 'font-bold', 'text-slate-400', 'uppercase', 'tracking-widest', 'bg-slate-100', 'px-2', 'py-0.5', 'rounded-md']
									},
									children: [{ type: 'text', value: lang === 'TEXT' ? 'CODE' : lang }]
								},
								// 复制按钮（用于客户端激活）
								{
									type: 'element',
									tagName: 'button',
									properties: {
										className: ['copy-btn', 'text-slate-400', 'hover:text-brand', 'transition-all', 'flex', 'items-center', 'gap-1.5', 'text-xs', 'font-medium'],
										'aria-label': '复制代码'
									},
									children: [
										{ type: 'text', value: '复制' } // 初始文本，客户端会替换为图标
									]
								}
							]
						},
						// 原始 PRE
						node
					]
				};

				// 修改 PRE 节点以清除冲突样式（类似于客户端逻辑）
				if (!node.properties.style) node.properties.style = '';
				node.properties.style += '; white-space: pre; word-break: normal; overflow-x: auto; tab-size: 4;';
				// 添加 Tailwind 覆盖类
				if (!node.properties.className) node.properties.className = [];
				node.properties.className.push('!m-0', '!bg-transparent', '!rounded-none', '!p-6');

				// 在父节点中用 Wrapper 替换 PRE
				if (typeof index === 'number' && parent) {
					parent.children[index] = wrapper;
				}
			}
		});
	};
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase } = locals;

	// 1. 获取文章详情
	const { data: article } = await supabase
		.from('articles')
		.select('*')
		.eq('slug', params.slug)
		.eq('published', true)
		.is('deleted_at', null)
		.single();

	if (!article) {
		throw error(404, '内容不存在');
	}

	// 2. 获取当前登录用户信息 (用于头像显示)
	const {
		data: { user }
	} = await supabase.auth.getUser();
	let currentUserProfile = null;

	if (user) {
		const { data: profile } = await supabase
			.from('profiles')
			.select('display_name, avatar_url')
			.eq('user_id', user.id)
			.single();
		currentUserProfile = profile;
	}


	// 3. 内容解析
	const file = await unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkRehype)
		.use(rehypeSlug)
		.use(rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] })
		.use(rehypeShiki, {
			themes: {
				light: 'one-light',
				dark: 'tokyo-night'
			},
			transformers: [
				transformerNotationDiff(),
				transformerNotationHighlight(),
				transformerNotationWordHighlight(),
				{
					name: 'add-language-and-line-numbers',
					pre(node: any) {
						if (this.options.lang) {
							node.properties['data-language'] = this.options.lang;
						}
						node.properties['data-line-numbers'] = '';
					},
					code(node: any) {
						const lines = this.source?.split('\n').length ?? 0;
						node.properties['data-line-count'] = lines;
					},
					line(node: any, line: any) {
						node.properties['data-line'] = line;
					}
				}
			]
		})
		.use(rehypeWrapCode) // 注入自定义包装器
		.use(rehypeStringify)
		.process(article.content ?? '');

	const contentHtml = String(file);

	// 4. TOC 提取
	const toc = [];
	if (article.content) {
		const slugger = new GithubSlugger();
		const regex = /^(#{2,3})\s+(.*)$/gm;
		let match;
		while ((match = regex.exec(article.content)) !== null) {
			const level = match[1].length;
			const text = match[2];
			// 在生成 slug 之前进行简单的文本清理，以匹配 rehype-slug 对原始 Markdown 的预期行为
			// github-slugger 会处理大部分情况，但如果文本中包含 **粗体** 等 Markdown 语法需要留意同步。
			// 目前假设标题主由纯文本组成。
			const id = slugger.slug(text);
			toc.push({ id, text, level });
		}
	}

	// 5. 获取文章作者信息
	let author = { name: '管理员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin' };
	if (article.created_by) {
		const { data: profile } = await supabase
			.from('profiles')
			.select('display_name, avatar_url')
			.eq('user_id', article.created_by)
			.single();
		if (profile) {
			author = {
				name: profile.display_name,
				avatar: profile.avatar_url || author.avatar
			};
		}
	}

	// 6. 阅读时间计算
	const contentStr = article.content ?? '';
	const chineseChars = (contentStr.match(/[\u4e00-\u9fa5]/g) || []).length;
	const englishWords = contentStr
		.replace(/[\u4e00-\u9fa5]/g, '')
		.split(/\s+/)
		.filter(Boolean).length;
	const readMinutes = Math.ceil(chineseChars / 300 + englishWords / 200);
	const readTime = `${Math.max(1, readMinutes)} 分钟阅读`;

	return {
		article: {
			title: article.title,
			category: article.category || '未分类',
			date: new Date(article.published_at).toLocaleDateString('zh-CN', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			}),
			excerpt: article.excerpt,
			readTime,
			author,
			cover:
				article.cover_image ||
				'https://images.unsplash.com/photo-1629904853716-f004c428670e?w=1200&auto=format&fit=crop&q=80',
			contentHtml,
			toc
		},
		currentUser: currentUserProfile,
		comments: await (async () => {
			const { data: commentsRaw, error: commentsError } = await supabase
				.from('comments')
				.select('id, content, created_at, author_id')
				.eq('article_id', article.id)
				.is('deleted_at', null)
				.order('created_at', { ascending: true });

			if (commentsError) {
				console.error('Fetch comments error:', commentsError);
				return [];
			}

			if (!commentsRaw || commentsRaw.length === 0) return [];

			const authorIds = [...new Set(commentsRaw.map((c) => c.author_id).filter(Boolean))];
			let profilesMap: Record<string, any> = {};

			if (authorIds.length > 0) {
				const { data: profilesData } = await supabase
					.from('profiles')
					.select('user_id, display_name, avatar_url')
					.in('user_id', authorIds);

				if (profilesData) {
					profilesMap = Object.fromEntries(profilesData.map((p) => [p.user_id, p]));
				}
			}

			return commentsRaw.map((c) => {
				const profile = profilesMap[c.author_id || ''];
				return {
					id: c.id,
					author: profile?.display_name || '系统用户',
					avatar: profile?.avatar_url || null,
					content: c.content,
					date: new Date(c.created_at).toLocaleString('zh-CN', {
						year: 'numeric',
						month: '2-digit',
						day: '2-digit',
						hour: '2-digit',
						minute: '2-digit'
					})
				};
			});
		})()
	};
};
