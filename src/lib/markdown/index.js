// @ts-nocheck
import matter from 'gray-matter';
import { unified } from 'unified';
import toMarkdownAST from 'remark-parse';
import toHtmlAST from 'remark-rehype';
import toHtmlString from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeShiki from '@shikijs/rehype';
import { transformerMetaHighlight } from '@shikijs/transformers';
import { rehypeCopyCode, rehypeAutoTitle, rehypeMermaid } from './plugins.js';

/**
 * unified markdown 处理管道
 */
const markdownProcessor = unified()
    .use(toMarkdownAST)
    .use([remarkGfm])
    .use(toHtmlAST, { allowDangerousHtml: true })
    .use([rehypeSlug, rehypeAutolinkHeadings])
    .use(rehypeMermaid) // 在 shiki 之前处理 mermaid
    .use(rehypeAutoTitle)
    .use(rehypeShiki, {
        theme: 'github-light',
        transformers: [
            {
                // 移除 tabindex 并计算行号宽度
                pre(node) {
                    if (node.properties.tabindex) {
                        delete node.properties.tabindex;
                    }

                    // 计算代码行数
                    const codeNode = node.children.find(n => n.type === 'element' && n.tagName === 'code');
                    if (codeNode && codeNode.type === 'element') {
                        const textNode = codeNode.children.find(n => n.type === 'text');
                        const code = textNode?.value || '';
                        const lines = code.trim().split('\n').length;
                        const digits = String(lines).length;
                        node.properties.style = (node.properties.style || '') + ` --line-width: ${digits}ch;`;
                    }
                }
            },
            transformerMetaHighlight()
        ]
    })
    .use(rehypeCopyCode)
    .use(toHtmlString, { allowDangerousHtml: true });

/**
 * 从文件名提取 slug
 */
function getSlug(filename) {
    return filename.split(/[\\/]/).at(-1)?.replace('.md', '') ?? '';
}

/**
 * 解析 frontmatter
 */
function frontmatter(content) {
    const { content: markdown, data } = matter(content);

    // 导出元数据供 Svelte 使用
    const meta = `
        <script module>
            export const metadata = ${JSON.stringify(data)}
        </script>
    `;

    return { markdown, meta };
}

/**
 * 处理 Markdown 内容
 */
async function parseMarkdown(content, slug) {
    const result = await markdownProcessor.process(content);
    return result.toString();
}

/**
 * 转义 Svelte 特殊字符
 */
function escapeHtml(content) {
    // 转义大括号
    content = content.replace(/{/g, '&#123;').replace(/}/g, '&#125;');

    // 恢复组件内的大括号
    const componentRegex = /<[A-Z].*/g;
    const components = content.match(componentRegex);
    components?.forEach((component) => {
        const replaced = component.replace('&#123;', '{').replace('&#125;', '}');
        content = content.replace(component, replaced);
    });

    return content;
}

/**
 * Vite 插件：Markdown 预处理
 */
function markdown() {
    return {
        name: 'markdown',
        // 处理 .md 文件
        async markup({ content, filename }) {
            if (!filename.endsWith('.md')) {
                return;
            }

            const slug = getSlug(filename);
            const { markdown, meta } = frontmatter(content);
            const html = await parseMarkdown(markdown, slug);
            const code = escapeHtml(html);

            return { code: meta + code };
        }
    };
}

export default markdown;
