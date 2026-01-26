import { supabase } from '$lib/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	type ResourceRow = {
		id: string;
		title: string;
		description: string | null;
		url: string;
		icon: string | null;
		category: string | null;
		category_name: string | null;
		tags: string[] | null;
	};

	type ResourceItem = {
		title: string;
		desc: string;
		url: string;
		icon: string;
		tags: string[];
	};

	type ResourceSection = {
		category: string;
		items: ResourceItem[];
	};

	const { data: rawResources, error } = await supabase
		.from('resources_with_category')
		.select('id,title,description,url,icon,category,category_id,category_name,tags')
		.is('deleted_at', null)
		.order('category', { ascending: true });

	if (error) {
		return { resources: [] };
	}

	const grouped = ((rawResources as unknown as ResourceRow[] | null) ?? []).reduce<
		ResourceSection[]
	>((acc, item) => {
		const categoryName = item.category_name ?? item.category ?? '未分类';
		let category = acc.find((section) => section.category === categoryName);
		if (!category) {
			category = { category: categoryName, items: [] };
			acc.push(category);
		}
		category.items.push({
			title: item.title,
			desc: item.description || '暂无描述',
			url: item.url,
			icon: item.icon || '',
			tags: item.tags ?? []
		});
		return acc;
	}, []);

	return {
		resources: grouped
	};
};
