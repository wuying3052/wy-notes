// @ts-nocheck
import { visit } from 'unist-util-visit';

/**
 * 检查节点是否为 rehype-code-title 容器
 */
function isCodeTitle(node) {
    if (node.tagName === 'div') {
        return node.properties?.className?.[0] === 'rehype-code-title';
    }
    return false;
}

/**
 * rehype 插件：自动为代码块添加标题
 */
export function rehypeAutoTitle() {
    return (tree) => {
        visit(tree, 'element', (node, index, parent) => {
            if (node.tagName !== 'pre' || !parent) return;

            // 提取语言
            const codeNode = node.children.find(c => c.tagName === 'code');
            if (!codeNode) return;

            const className = codeNode.properties?.className || [];
            const langClassIdx = className.findIndex(c => c.startsWith('language-'));

            let lang = 'text';
            let filename = '';

            if (langClassIdx !== -1) {
                // 解析 language-lang:filename
                const fullLang = className[langClassIdx].replace('language-', '');
                if (fullLang.includes(':')) {
                    [lang, filename] = fullLang.split(':');
                    // 修复 class，移除文件名，避免影响 shiki 高亮
                    className[langClassIdx] = `language-${lang}`;
                } else {
                    lang = fullLang;
                }
            }

            // 插入标题节点
            const titleNode = {
                type: 'element',
                tagName: 'div',
                properties: {
                    className: ['rehype-code-title'],
                    'data-filename': filename || undefined
                },
                children: [{ type: 'text', value: lang }]
            };

            parent.children.splice(index, 0, titleNode);
            return index + 2;
        });
    };
}

/**
 * rehype 插件：添加复制功能
 */
export function rehypeCopyCode() {
    return (tree) => {
        visit(tree, isCodeTitle, (node) => {
            if (node.type !== 'element') return;

            // 提取标题 (语言)
            const lang = node.children[0]?.type === 'text'
                ? node.children[0].value
                : '';

            // 提取文件名
            const filename = node.properties?.['data-filename'];

            // 重构为包含按钮的结构
            const children = [];

            // 1. 文件名
            if (filename) {
                children.push({
                    type: 'element',
                    tagName: 'span',
                    properties: { className: ['code-filename'] },
                    children: [{ type: 'text', value: filename }]
                });
            }

            // 2. 语言类型
            children.push({
                type: 'element',
                tagName: 'span',
                properties: { className: ['code-title-text'] },
                children: [{ type: 'text', value: lang }]
            });

            // 3. 复制按钮
            children.push({
                type: 'element',
                tagName: 'button',
                properties: {
                    className: ['copy-btn'],
                    'aria-label': '复制'
                },
                children: [{ type: 'text', value: '复制' }]
            });

            node.children = children;
        });
    };
}
