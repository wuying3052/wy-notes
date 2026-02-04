import resourcesRaw from '@data/resources.json';

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

export const load = async () => {
	const grouped = resourcesRaw.reduce<ResourceSection[]>((acc, item) => {
		const categoryName = item.category || '未分类';
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
