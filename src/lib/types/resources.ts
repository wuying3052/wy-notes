/**
 * 资源数据类型定义
 */

export interface ResourceItem {
    title: string;
    desc: string;
    url: string;
    icon: string;
    tags: string[];
}

export interface ResourceSection {
    category: string;
    items: ResourceItem[];
}
