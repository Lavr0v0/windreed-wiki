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

生成供 GitHub Pages 使用的纯静态网站：

```bash
GITHUB_PAGES=true npm run build
```

构建结果位于 `dist/client/`。推送到 `main` 后，仓库中的 GitHub Actions 工作流会自动完成构建与发布。

## 内容发布原则

- 只有列入公开清单的档案会进入导航和搜索。
- 未公开的 Obsidian 工作资料不会进入网站。
- 地点与设定词条可以从正文中的注释链接展开。
- 角色画像只使用作者明确提供的素材。
