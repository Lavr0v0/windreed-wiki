# 风芦旅人网站发布流程

这份流程用于把 Obsidian 本地档案、人物专页、三维模型和网站界面安全同步到线上。默认公开站为 `https://windreed.wiki/`，修史室为 `https://edit.windreed.wiki/`。

## 发布原则

- 本地和线上都可能被修改。先拉取并比较，再推送；不得静默覆盖协作者版本。
- `.env.cloudflare`、访问令牌、同步包和构建目录不得提交到 Git。
- 不自动新建、切换或强推分支。只有站主明确要求时才创建分支或 PR。
- `content/source/` 是 Obsidian 的公开源文件；只有公开清单中的词条会进入网站。
- 字体使用完整 Unicode 分段资源。新增文字不需要重新制作字体子集。

## 1. 检查工作区

确认修改文件和新增资源都在预期范围内，尤其检查未跟踪的文章、图片、GLB、HTML、CSS 与 JavaScript。不要清理或回退不属于本次发布的本地修改。

项目要求 Node.js 22 或更高版本。若系统 `node` 仍是旧版本，应先切换到新版 Node，再执行后续命令。

## 2. 对齐线上内容

```powershell
npm run content:export-online
npm run content:pull -- .windreed-sync/online-d1.json
npm run content:status
```

状态处理：

- `本地有修改`：可以继续推送。
- `线上有修改`：保留到 `content/incoming/`，人工合并到本地源文件。
- `发生冲突`：比较线上和本地正文、摘要、别名及名片字段；确认不会丢失线上内容后再建立新基准。
- `仅线上存在`：默认保留，不因本地发布而删除。

完成核对后生成推送包并导入线上草稿：

```powershell
npm run content:push
npm run content:import-drafts
```

`content:import-drafts` 只保存草稿，不会立即改变公开页面。

## 3. 发布前检查

```powershell
npm run typecheck
npm run lint
node --test tests/brand-assets.test.mjs tests/content-sync.test.mjs tests/markdown-formatting.test.mjs tests/navigation-regressions.test.mjs tests/performance-regressions.test.mjs tests/experience-regressions.test.mjs
npm test
```

同时检查公开内容不得出现 `ChatGPT`、待定、待补、工作记录、候选名称或“需要 DM 同意”等编辑口吻。生产构建成功后，确认 `dist/server/index.js` 和静态资源已经生成。

## 4. 公开词条并清除缓存

```powershell
npm run content:publish
```

该命令只发布当前 `.windreed-sync/outbox.json` 中、且线上草稿与本地内容完全一致的词条。它会核对线上版本、设置公开版本并删除公开档案缓存。任何词条在导入后又被修改时，命令会停止而不是覆盖。

## 5. 部署公开站和修史室

```powershell
npm run cloudflare:prepare
npm run cloudflare:migrate
npx wrangler deploy --config dist/server/wrangler.deploy.json
```

部署配置同时维护 `windreed.wiki` 与 `edit.windreed.wiki`。没有数据库结构变化时，迁移命令应安全地报告无新增迁移。

托管镜像站还需要保存并部署同一 Git 提交对应的 Sites 版本。必须使用同一次构建产物和相同提交，不能用未提交或不同版本的源码打包。

## 6. 保存源码

提交前再次检查 `git status` 和 `git diff --check`。提交所有确认要上线的本地文章、UI、三维模型和测试；不要提交密钥、`.windreed-sync/` 或 `dist/`。将当前验证过的提交推送到约定的 GitHub 分支，禁止强推。

## 7. 上线后核对

至少确认：

- `https://windreed.wiki/` 能打开，Logo、字体、搜索和导航正常。
- 新文章的公开路径可访问，正文没有编辑口吻。
- 「枝桠」页面先显示海报，点击后才下载模型。
- `https://edit.windreed.wiki/` 可登录并显示已发布状态。
- Sites 镜像版本部署成功。

最后重新执行一次线上导出、拉取和 `content:status`，为本次发布建立新的共同基准；仍然存在的线上专有词条或未合并协作者版本应单独记录，不得自动删除。
