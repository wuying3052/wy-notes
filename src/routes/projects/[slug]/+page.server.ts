import { supabase } from '$lib/supabase';
import { error } from '@sveltejs/kit';
import { marked, type Tokens } from 'marked';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { data: project } = await supabase
		.from('projects')
		.select('*')
		.eq('slug', params.slug)
		.eq('published', true)
		.is('deleted_at', null)
		.single();

	if (!project) {
		throw error(404, '内容不存在');
	}

	const { data: nextProject } = await supabase
		.from('projects')
		.select('title, slug, cover_image, description')
		.eq('published', true)
		.is('deleted_at', null)
		.neq('id', project.id)
		.limit(1)
		.maybeSingle();

	type ContentBlock =
		| { key: string; type: 'heading'; depth: number; text: string; id: string }
		| { key: string; type: 'paragraph'; text: string }
		| { key: string; type: 'list'; ordered: boolean; items: string[] }
		| { key: string; type: 'code'; text: string; lang?: string }
		| { key: string; type: 'blockquote'; text: string }
		| { key: string; type: 'hr' };

	const toSlug = (text: string) =>
		text
			.toLowerCase()
			.trim()
			.replace(/[^\w\u4e00-\u9fa5]+/g, '-')
			.replace(/^-+|-+$/g, '');

	// 1. 从标题生成目录
	const tokens = marked.lexer(project.long_description ?? '');
	const tocItems = tokens
		.filter((t) => t.type === 'heading')
		.map((t) => {
			const heading = t as Tokens.Heading;
			return {
				id: toSlug(heading.text),
				text: heading.text,
				depth: heading.depth
			};
		});

	// 2. 渲染完整 HTML 内容
	// 使用渲染器为 HTML 标题添加 ID，以便锚点链接正常工作
	const renderer = new marked.Renderer();
	renderer.heading = ({ text, depth }: { text: string; depth: number }) => {
		const slug = toSlug(text.replace(/<[^>]*>?/gm, '')); // 去除标签以生成 slug
		return `<h${depth} id="${slug}">${text}</h${depth}>`;
	};

	const contentHtml = await marked.parse(project.long_description ?? '', { renderer });

	return {
		project: {
			title: project.title,
			slug: project.slug,
			desc: project.description,
			contentHtml, // 用于渲染的 HTML
			tocItems,    // 用于目录的结构化数据
			tags: project.tags ?? [],
			image:
				project.cover_image ||
				'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
			demoUrl: project.demo_url || '',
			repoUrl: project.repo_url || '',
			year: project.year?.toString()
		},
		nextProject: nextProject
			? {
				title: nextProject.title,
				desc: nextProject.description,
				image:
					nextProject.cover_image ||
					'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
				url: `/projects/${nextProject.slug}`
			}
			: null
	};
};
