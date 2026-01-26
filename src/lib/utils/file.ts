import { PUBLIC_STORAGE_URL } from '$env/static/public';

/**
 * 根据文件路径生成公开访问 URL
 * @param path - 文件路径 (可能是内部存储路径 path/to/file，也可能是完整的外部 URL)
 * @returns 完整的可访问 URL
 */
export function getPublicUrl(path: string | null | undefined): string {
    if (!path) return '';

    // 如果已经是完整的 URL (http:// 或 https:// 开头)，直接返回
    if (path.match(/^https?:\/\//)) {
        return path;
    }

    // 否则拼接 PUBLIC_STORAGE_URL
    // 规范化路径：移除开头的斜杠
    const normalizedPath = path.replace(/^\/+/, '');

    // 如果没有配置 PUBLIC_STORAGE_URL，回退到空字符串或抛出错误视需求而定
    return `${PUBLIC_STORAGE_URL}/${normalizedPath}`;
}
