---
title: "微信分享卡片实现复盘：OG 配置、Cloudflare 放行与缓存策略"
date: "2026-02-11"
description: "总结 WY NOTES 微信分享卡片从无法展示到恢复展示的完整方案，包含核心文件、关键代码、Cloudflare 规则与排障清单。"
tags: ["SvelteKit", "SEO", "Open Graph", "Cloudflare", "WeChat"]
published: true
---

# 微信分享卡片实现复盘：OG 配置、Cloudflare 放行与缓存策略

这篇文章沉淀本次「微信分享链接不出卡片」问题的完整落地方案，目标是让后续同类问题可以快速定位、快速恢复。

---

## 1. 问题现象与结论

### 1.1 现象

- Telegram 可正常出卡片；
- 微信里仅显示冷链接（纯 URL 文本）；
- 同一链接有时稍后恢复，表现不稳定。

### 1.2 最终结论

这类问题通常不是单点原因，而是三件事叠加：

1. 页面 `og:image` 链接必须真实可访问且 HTTPS；
2. 微信抓取流量不能被 Cloudflare 挑战/拦截；
3. 微信有缓存，修复后不会立刻对旧链接生效。

---

## 2. 采用的实现方案

### 2.1 元标签策略

采用标准 OG 协议作为主方案，每个页面保证最小必备项：

- `og:type`
- `og:title`
- `og:description`
- `og:image`
- `og:url`
- `<title>`

并补充增强项（非必须，但实测更稳定）：

- `og:image:secure_url`
- `og:image:type`
- `og:image:width`
- `og:image:height`
- `twitter:*` 对应字段
- `canonical`

### 2.2 Cloudflare 策略

在 WAF Custom Rule 中对微信 UA 使用 `Skip`：

- 匹配条件：`Hostname = notes.wuying3052.cn` 且 `User-Agent contains MicroMessenger`（可补 `WeChat`）
- 跳过组件：Managed Rules、Super Bot Fight Mode、BIC、Rate Limiting 等

### 2.3 缓存策略

修复后验证必须使用新 URL（如 `?v=20260210x`）触发微信重新抓取。

---

## 3. 核心文件与职责

### 3.1 全局站点配置

文件：`src/lib/config/site.ts`

职责：统一站点 URL、OG 图片、图片类型和尺寸，避免各页面硬编码不一致。

```ts
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
```

### 3.2 页面级 `svelte:head`

核心页面（首页、资源页、文章列表、文章详情、项目页、项目详情）都在各自 `+page.svelte` 内维护独立 OG，保证 SSR 输出直接可抓取。

典型结构：

```svelte
<svelte:head>
  <title>{pageTitle}</title>
  <link rel="canonical" href={pageUrl} />
  <meta name="description" content={pageDescription} />

  <meta property="og:type" content="website" />
  <meta property="og:url" content={pageUrl} />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={pageDescription} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:image:secure_url" content={ogImage} />
  <meta property="og:image:type" content={SITE_CONFIG.ogImageType} />
  <meta property="og:image:width" content={SITE_CONFIG.ogImageWidth} />
  <meta property="og:image:height" content={SITE_CONFIG.ogImageHeight} />
</svelte:head>
```

---

## 4. 本次修复中的关键点

### 4.1 修正错误图片路径

最初存在部分页面使用了不存在的 `og-image.png`，已统一改为可访问的 `og-image.jpg` 或 `SITE_CONFIG.ogImage`。

### 4.2 去掉冲突风险

布局层仅保留全局基础标签（如 `og:site_name`、`og:locale`），避免页面层与布局层输出冲突的 `og:title/og:image`。

### 4.3 保证微信抓取可达

Cloudflare 自定义规则对微信 UA 执行 `Skip`，避免挑战流程阻断爬虫抓取。

---

## 5. 线上排查清单（实战版）

按优先级从快到慢排查：

1. `curl` 或浏览器直接访问页面源码，确认 OG 已在 SSR HTML 中；
2. 访问 `og:image`，确认 `200`、HTTPS、无鉴权；
3. Cloudflare Security Rules 确认微信 UA 命中放行规则；
4. 新链接参数重试（微信缓存）；
5. 若仍失败，再检查 DNS/线路与微信侧策略。

---

## 6. 经验总结

- OG 标签正确只是前提，不是全部；
- 微信分享问题经常是「标签 + 安全策略 + 缓存」组合问题；
- 统一 `SITE_CONFIG` 与页面 head 模板，能显著降低回归概率；
- 把 Cloudflare 放行规则固定化，是长期稳定的关键。

---

## 7. 可复用模板（建议）

后续新增页面时，至少复用以下字段：

- `title`
- `description`
- `canonical`
- `og:type`
- `og:url`
- `og:title`
- `og:description`
- `og:image`

再按需补 `og:image:*` 与 `twitter:*` 即可。

