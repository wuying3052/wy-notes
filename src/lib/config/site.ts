/**
 * 网站全局配置
 * 所有需要使用网站 URL 的地方都从这里导入
 */

// 从环境变量读取，如果没有则使用默认值
export const SITE_URL = import.meta.env.PUBLIC_SITE_URL || 'https://notes.wuying3052.cn';

// 网站基本信息
export const SITE_CONFIG = {
    name: 'WY NOTES',
    title: 'WY NOTES - 技术与学习笔记',
    description: '记录学习过程，分享技术笔记。',
    url: SITE_URL,
    ogImage: `${SITE_URL}/og-image.jpg`,
    ogImageType: 'image/jpeg',
    ogImageWidth: '800',
    ogImageHeight: '800',
    locale: 'zh_CN'
} as const;
