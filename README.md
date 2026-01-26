# WY NOTES - 全栈内容管理系统

WY NOTES 是一个基于 **SvelteKit** 和 **Supabase** 构建的现代化、极简主义全栈内容管理系统 (CMS)。它不仅是一个博客，更是一个集成了文章、项目展示、资源分享和完整后台管理的数字花园。

> 🤖 **Powered by Antigravity**  
> 本项目是 **Vibe Coding** 理念的一次完整实践：由开发者把握顶层设计与审美取向 (The Vibe)，通过 Google DeepMind 的 **Antigravity** AI 智能体协助落地全栈代码实现。

## ✨ 核心特性

- **极简 UI 设计**: 采用 Tailwind CSS v4 打造的玻璃拟态与极简风格，注重阅读体验。
- **全栈架构**: SvelteKit (Svelte 5 Runes) + Supabase (PostgreSQL) 的强大组合。
- **RBAC 权限管理**: 完善的角色系统（访客、用户、创作者、管理员），保障数据安全。
- **自动化维护**:
    - **自动资料创建**: 用户注册即自动生成个人资料。
    - **文件引用追踪**: 智能识别未被引用的“僵尸文件”并提供清理工具，节省存储空间。
- **SEO 友好**: 服务端渲染 (SSR) 确保搜索引擎最佳收录，动态生成的 Sitemap 和 RSS。
- **高性能**: 图片自动压缩、懒加载、边缘函数支持。

## 🛠️ 技术栈

- **前端框架**: [SvelteKit](https://kit.svelte.dev/) (Svelte 5 - Runes)
- **后端服务**: [Supabase](https://supabase.com/) (Auth, Database, Storage, Edge Functions)
- **样式方案**: [Tailwind CSS v4](https://tailwindcss.com/)
- **图标库**: Lucide Icons
- **工具链**: TypeScript, Vite

---

## 🚀 快速开始

### 1. 前置准备
- Node.js 18+
- 一个 [Supabase](https://supabase.com/) 账号并创建一个新项目。

### 2. 获取代码
```bash
git clone https://github.com/your-repo/wy-notes.git
cd wy-notes
```

### 3. 安装依赖
```bash
npm install
```

### 4. 环境配置 (关键步骤)
在项目根目录创建 `.env` 文件（可复制 `.env.example` 修改），填入你的 Supabase 配置：

```env
# 你的 Supabase 项目 URL
PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"

# 你的 Supabase Anon Key (公钥，用于客户端)
PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 你的 Supabase Service Role Key (私钥，仅用于服务端管理任务，如文件清理)
# ⚠️ 严禁暴露给客户端！
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 5. 数据库初始化
本项目依赖 PostgreSQL 的表结构、函数和 Trigger。
- 请参考项目中的 `supabase_schema.sql` (若有) 或手动在 Supabase SQL Editor 中创建表结构。
- 确保开启了 **RLS (Row Level Security)** 行级安全策略，否则数据可能面临风险。

### 6. 启动开发服务器
```bash
npm run dev
```
打开浏览器访问 `http://localhost:5173` 即可看到项目运行。

---

## 📦 部署指南

本项目适配所有支持 Node.js 或 Edge Adapter 的部署平台（如 Vercel, Netlify, Cloudflare Pages）。

### Vercel 部署 (推荐)
1. 在 Vercel 导入你的 GitHub 仓库。
2. 在 Vercel 项目设置中，添加上述的环境变量 (`PUBLIC_SUPABASE_URL` 等)。
3. 点击 **Deploy**，等待构建完成即可。

---

## ⚠️ 注意事项与最佳实践

1.  **权限安全 (RLS)**
    *   为了数据安全，我们在数据库层面启用了 RLS。这意味着即使前端代码泄露，没有对应权限的用户也无法直接操作数据库。
    *   **开发提示**: 如果发现查询不到数据，首先检查 RLS 策略 (Policies) 是否正确配置。

2.  **文件存储 (Storage)**
    *   默认存储桶名称为 `wyNotes`。请在 Supabase Storage 面板提前创建好这些 bucket，并设置为 Public。

3.  **Service Role Key**
    *   `SUPABASE_SERVICE_ROLE_KEY` 拥有绕过 RLS 的上帝权限，**绝对不要**在任何以 `PUBLIC_` 开头的环境变量中使用它，也不要将其提交到 Git 仓库。

---

## 🤝 参与开发与免责声明

本项目是一个开源的模板与学习案例，虽然已经实现了核心的 CMS 功能，但在某些细节上可能仍有优化空间

**这不仅仅是一个成品，更是一个起点。**

如果你对 Svelte 5、全栈开发感兴趣，非常欢迎 Fork 本项目进行二次开发。无论是修复 Bug、增加新功能，还是仅仅用来作为你的个人博客，都非常棒！

如果你在使用过程中遇到问题，欢迎提交 Issue 或 PR。🌱

---

## 📝 维护注记
- **数据库备份**: 完整的表结构和初始权限 SQL 位于 `supabase_schema.sql`。
- **权限修复**: 若遇到权限拒绝 (`42501`)，通常是因为 `public` schema 重置后未重新运行 `GRANT` 语句。请参考 SQL 备份文件末尾的权限声明。

