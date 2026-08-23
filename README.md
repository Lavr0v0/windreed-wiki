# The Windreed Wayfarers

风芦旅人公开档案网站，收录人物生平、世界词条、时间线与关系档案。

## 本地运行

需要 Node.js 22 或更高版本。

```bash
npm ci
npm run dev
```

## 检查与构建

```bash
npm run lint
npm test
```

生成包含动态路由与公开 API 的生产构建：

```bash
npm run build
```

构建结果位于 `dist/`。当前网站依赖动态首页、搜索、修史室 API 与 D1，不能导出为 GitHub Pages 纯静态站。推送和拉取请求会运行类型、代码风格、生产构建与全部回归测试；正式发布按 `docs/PUBLISHING.md` 的 Cloudflare 流程执行。

## 内容发布原则

- 只有列入公开清单的档案会进入导航和搜索。
- 未公开的 Obsidian 工作资料不会进入网站。
- 地点与设定词条可以从正文中的注释链接展开。
- 角色画像只使用作者明确提供的素材。
