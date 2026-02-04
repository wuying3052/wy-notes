import projects from '@data/projects.json';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const project = (projects as any[]).find((p) => p.id === params.slug || (p.slug && p.slug === params.slug));

	if (!project) {
		error(404, 'Project not found');
	}

	return {
		project: {
			...project,
			image: project.cover || '',
			demoUrl: project.url || '',
			repoUrl: project.github_url || '',
			year: '2026', // 默认或添加到 json

			contentHtml: `<p>${project.description}</p>`, // 简单的后备

			tocItems: []
		}
	};
};
