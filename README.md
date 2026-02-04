# WY NOTES

<div align="center">
  <h3>让知识更可检索，让实践更可复用</h3>
  <p>一个基于 SvelteKit + Tailwind CSS v4 构建的现代个人技术博客</p>

  <div>
    <img src="https://img.shields.io/badge/Svelte-5.0-orange?style=flat-square&logo=svelte" alt="Svelte 5" />
    <img src="https://img.shields.io/badge/SvelteKit-2.0-ff3e00?style=flat-square&logo=svelte" alt="SvelteKit" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=flat-square&logo=vercel" alt="Vercel" />
    <img src="https://img.shields.io/badge/Vibe_Coding-Antigravity-FF0080?style=flat-square&logo=sparkles" alt="Vibe Coding with Antigravity" />
    <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
  </div>
</div>

---

## 📖 简介

**WY NOTES** 是一个专注于技术分享与沉淀的个人博客平台。它不仅仅是一个静态的文字展示站，更是一个追求极致交互体验和视觉美感的现代 Web 应用。

项目采用最新的 **Svelte 5** 和 **Tailwind CSS v4** 技术栈构建，融合了 Glassmorphism（毛玻璃）、Spotlight（聚光灯）、Staggered Animation（交错动画）等现代设计元素，同时保持了极佳的性能和 SEO 优化。

## ✨ 核心特性

### 🎨 极致 UI/UX
- **沉浸式 Hero 区域**: 采用 Fluid Gradient 流光标题与交错入场动画，营造极佳的第一印象。
- **现代化卡片设计**:
  - **Glassmorphism**: 悬浮导航卡片采用高斯模糊与半透明白底，轻盈通透。
  - **3D Tilt Effect**: 特色项目卡片支持鼠标跟随的 3D 倾斜视差效果。
  - **Interactive Grid**: 技术栈展示采用紧凑网格布局，支持鼠标互动。
- **移动端适配**: 精心打磨的移动端布局，确保在手机上的阅读体验与桌面端一样优雅（如优化的 Grid 布局、自适应字体与间距）。

### 🛠️ 强大功能
- **Markdown 渲染管线**: 
  - 基于 `unified` + `remark` + `rehype` 的强大处理链。
  - 支持 **GFS (GitHub Flavored Markdown)**。
  - **Shiki** 代码高亮，支持丰富的主题与语言检测。
  - 自动生成目录 (TOC) 与锚点导航。
- **SEO 友好**:
  - 服务端渲染 (SSR) 确保搜索引擎完美抓取。
  - 自动生成 `sitemap.xml`。
  - 完善的 Open Graph 与 Twitter Card Meta 标签支持。
- **深色模式**: (进行中) 内置深色模式支持基础架构。

## 🏗️ 技术栈列表

| 类别 | 技术 | 说明 |
| --- | --- | --- |
| **核心框架** | [SvelteKit](https://kit.svelte.dev/) | 全栈 Web 框架 (SSR/SSG) |
| **UI 库** | [Svelte 5](https://svelte.dev/) | 下一代响应式 UI 框架 (Runes) |
| **样式系统** | [Tailwind CSS v4](https://tailwindcss.com/) | 原子化 CSS 引擎，性能极致 |
| **图标库** | [Lucide Svelte](https://lucide.dev/) | 风格统一、轻量的 SVG 图标集 |
| **内容处理** | [Unified](https://unifiedjs.com/) | Markdown AST 处理生态 |
| **代码高亮** | [Shiki](https://shiki.style/) | 基于 TextMate 语法的精准高亮 |
| **工具链** | [Vite](https://vitejs.dev/) | 极速前端构建工具 |
| **部署** | [Vercel](https://vercel.com/) | 零配置自动化部署 |

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/wuying3052/wy-notes.git
cd wy-notes
```

### 2. 安装依赖

本项目使用 `npm` 进行包管理。请勿混用 `yarn` 或 `pnpm`，以免锁文件冲突。

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173` 即可预览项目。

### 4. 构建生产版本

```bash
npm run build
```

## 📂 项目结构

```
wy-notes/
├── src/
│   ├── lib/
│   │   ├── assets/        # 静态资源 (图片, SVG)
│   │   ├── components/    # Svelte 组件
│   │   │   ├── layout/    # 布局组件 (Header, Footer)
│   │   │   └── ui/        # 通用 UI 组件 (Card, Button, Reveal...)
│   │   ├── config/        # 站点配置
│   │   ├── content/       # (可选) 本地 Markdown 内容
│   │   └── utils/         # 工具函数
│   └── routes/            # SvelteKit 路由页面
│       ├── +layout.svelte # 全局布局
│       ├── +page.svelte   # 首页
│       └── ...
├── static/                # 纯静态文件 (robots.txt, favicon)
├── tailwind.config.ts     # Tailwind 配置
└── svelte.config.js       # SvelteKit 配置
```

## 📝 内容管理

文章内容通常位于 `src/content` 或通过 CMS 获取（视具体实现而定）。Markdown 文件须包含 Frontmatter：

```yaml
---
title: "Svelte 5 新特性解析"
date: "2024-03-20"
description: "深入探讨 Runes 反应性系统的变革..."
tags: ["Svelte", "Frontend"]
cover: "/images/covers/svelte-5.webp"
---
```

## 🤝 贡献指南

欢迎提交 Issue 或 Pull Request 来改进这个项目！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 🙏 致谢

本项目在技术实现和架构设计上深入参考了 [**Joy of Code**](https://joyofcode.xyz/) 的精彩分享与教程，特此致谢。

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源。

---

<div align="center">
  <p>Made with ❤️ by Wuying</p>
</div>
