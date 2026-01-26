export type SiteNavItem = {
	name: string;
	href: string;
};

export const siteNavItems: readonly SiteNavItem[] = [
	{ name: '首页', href: '/' },
	{ name: '文章', href: '/articles' },
	{ name: '项目', href: '/projects' },
	{ name: '资源', href: '/resources' }
] as const;
