import { getPosts } from '$lib/server/content';
import projectsRaw from '@data/projects.json';

export const load = async () => {
	const posts = await getPosts();
	const recentPosts = posts.slice(0, 2).map((post) => ({
		title: post.title,
		excerpt: post.description || '暂无摘要',
		created_at: post.date,
		slug: post.slug,
		cover_image: post.cover_image,
		tag: post.tags?.[0] || '文章'
	}));

	const featuredProjects = projectsRaw.slice(0, 2).map((proj, index) => ({
		name: proj.title,
		desc: proj.description,
		color: index % 2 === 0 ? 'bg-sky-500' : 'bg-blue-500'
	}));

	return {
		recentPosts,
		projects: featuredProjects
	};
};
