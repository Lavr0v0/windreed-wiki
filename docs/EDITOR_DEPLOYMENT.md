# 档案修史室部署说明

编辑后台与 API 运行在 Cloudflare Workers，档案与版本记录存入 D1。第一版不需要另租 VPS，不依赖 GitHub 登录，也不把 Obsidian 原库交给协作者。

## 架构与费用

- `edit.windreed.wiki`：受 Cloudflare Access 保护的修史室。
- `windreed.wiki`：公开档案。初次测试时继续由 GitHub Pages 提供；确认后台可用后再切给同一个 Worker。
- Cloudflare Access：站主可使用 Cloudflare 账户登录，协作者使用邮箱验证码。Access 与应用数据库各检查一次权限。
- 应用权限：管理员可管理所有词条；协作者只能编辑并发布管理员分配给自己的词条。
- 在 Workers、D1 与 Access 免费额度内，持续软件费用为 0。任何要求升级付费套餐的提示都应先停止，不要确认购买。

## 首次配置

以下操作会创建外部资源或改变 DNS，应由站主明确同意后再执行。

1. 把 `windreed.wiki` 加入 Cloudflare，并在 Porkbun 把域名服务器改为 Cloudflare 给出的两条 nameserver。已有的 GitHub Pages DNS 记录先原样导入，公开站不会因此立即换服务器。
2. 登录 Wrangler：`npx wrangler login`。
3. 创建数据库：`npx wrangler d1 create windreed-wiki`，保存输出中的 `database_id`。
4. 在 Cloudflare Zero Trust 创建 Self-hosted Access application：
   - 域名填写 `edit.windreed.wiki`；
   - 登录方式启用 Cloudflare 与 Email one-time PIN；
   - 站主策略使用 `Include: Cloudflare Account Member`；
   - 协作者策略使用 `Include: Emails` 列出受邀地址，并用 `Require: Login Methods / One-time PIN` 限定验证方式；
   - 记下 Application Audience (AUD) Tag 和团队域名。
5. 复制 `.env.cloudflare.example` 为 `.env.cloudflare`，填写数据库 ID、Access 团队域名、AUD 和站主邮箱。这个文件已经被 `.gitignore` 排除，不会提交到 GitHub。

## 首次发布

必须在站主明确说“构建 / 部署”之后执行：

```powershell
npm run cloudflare:deploy
```

首次部署只绑定 `edit.windreed.wiki`。打开编辑站后：

1. 站主使用 Cloudflare 账户登录；
2. 点击“导入现有公开档案”；
3. 在“协作者与权限”中添加朋友邮箱并勾选词条；
4. 把同一个朋友邮箱加入 Access 的 OTP 邮箱策略，并请其在中国大陆常用网络上测试验证码、保存和发布；
5. 测试通过后才把 `WINDREED_ENABLE_PUBLIC_DOMAIN` 改成 `1` 并再次部署，使 `windreed.wiki/*` 通过 Workers Route 从同一 D1 读取已发布内容。现有 GitHub Pages A 记录可以保留作为回退基础，无需让 Worker 接管 DNS 记录本身。

如果浏览器不便完成首次导入，可以生成并执行幂等的初始导入文件：

```powershell
npm run editor:seed:export
npx wrangler d1 execute windreed-wiki --remote --file .wrangler/windreed-editor-seed.sql
```

## 日常使用

- 协作者只需访问 `https://edit.windreed.wiki`，输入受邀邮箱和验证码。
- 正文约 2.6 秒自动保存一次，也可以手动“保存草稿”。
- “发布这一版”只公开当前版本；每次保存都进入版本历史，恢复旧版不会删除任何新版本。
- 公开检查会拦截 ChatGPT、问卷、待定、待补、工作记录等不应出现在公开档案里的措辞。
- 邀请朋友时，需要同时把邮箱加入 Access 的 OTP 策略和修史室的“协作者与权限”；朋友不需要 Cloudflare 或 GitHub 密码。
- OTP 邮件可能延迟数分钟；每次重新申请都会使上一枚验证码失效，因此只使用最新一封邮件中的验证码。

## 本地与线上内容同步

内容同步与代码部署是两套独立流程：

- **内容同步**：在 Obsidian 源文件与修史室草稿之间传递公开档案内容，不触发网站构建。
- **代码部署**：发布网页程序、样式和组件，仍由 GitHub 与 Cloudflare 工作流完成。
- **发布词条**：把修史室中的某一版草稿标记为公开；公开域名接入 D1 后访客才会看到。

同步采用带版本号的 JSON 内容包。系统使用“共同基准版本”判断修改来自本地、线上或两边；检测到冲突时不会覆盖任何一方。

### 线上修改同步回本地

1. 在修史室打开“内容同步”，点击“下载线上同步包”。
2. 在项目目录运行：

```powershell
npm run content:pull -- "C:\下载目录\windreed-online-YYYY-MM-DD.json"
npm run content:status
```

3. 线上新增、线上修改和冲突内容会写入 `content/incoming/`：
   - `<slug>.md` 是便于在 Obsidian 阅读和合并的正文；
   - `<slug>.json` 保存完整字段与线上版本号，不能只看 Markdown 后忽略摘要、别名或名片字段。
4. 人工把确认后的内容合并进 `content/source/` 与 `app/archive-manifest.ts`。再次执行同一条 `content:pull`，使相同内容成为新的共同基准。

脚本不会自动改写 Obsidian 源文件，也不会自动删除线上内容。

### 本地修改推送到线上

1. 先完成一次线上拉取，并运行 `npm run content:status`。
2. 正常编辑 Obsidian 与公开清单，然后运行：

```powershell
npm run content:push
```

3. 脚本生成 `.windreed-sync/outbox.json`。在修史室“内容同步”中选择该文件并“导入为草稿”。
4. 导入结果会分别列出新建、更新、无需更新与冲突。检查草稿后再逐条发布。
5. 发布完成后重新下载并拉取一次线上同步包，建立新的共同基准。

`content:push` 只收集“本地有修改”和“仅本地存在”的词条。若线上已经变化或同一词条两边都改过，该词条会暂停推送并报告冲突。

### 同步状态术语

- **已同步**：本地与线上内容相同。
- **本地有修改**：可生成本地推送包。
- **线上有修改**：先拉取并合并线上版本。
- **发生冲突**：本地与线上都偏离共同基准，必须人工合并。
- **仅本地存在 / 仅线上存在**：某一侧新建的词条。

`.windreed-sync/` 与 `content/incoming/` 都是本机工作目录，已排除在 Git 提交之外。

### 管理员命令行备用通道

修史室的同步接口尚未部署或浏览器不可用时，管理员可以直接通过已登录的 Wrangler 处理同一种内容包：

```powershell
npm run content:export-online
npm run content:pull -- .windreed-sync/online-d1.json
npm run content:status
npm run content:push
npm run content:import-drafts
```

`content:import-drafts` 会再次核对线上版本，只新增待发布草稿与版本历史，不改变 `published_revision`。该备用通道需要 Node.js 22、`.env.cloudflare` 与有 D1 权限的 Wrangler 登录状态；普通协作者不使用它。

## 公共 URL 结构

- 角色专页使用 `/characters/{slug}/`，例如 `/characters/shirul/`。
- `/DnD/` 语义不够明确，现仅作为旧链接兼容入口，并跳转到 `/characters/`。
- 档案词条继续使用 `/archive/{category}/{slug}`。编辑器中的 **URL 路径（slug）** 指永久链接末尾的小写标识，不是页面标题。

## GitHub Pages 回退

在 `windreed.wiki` 正式切换前，GitHub Pages 继续提供旧版公开站。新后台分支不应先合并到当前 Pages 发布分支；动态 API 与 D1 路由不是 GitHub Pages 的静态功能。完成切换后再把生产工作流改为 Cloudflare 部署。

## Obsidian 与隐私

D1 保存修史室草稿、版本历史和线上发布状态；`content/source` 保存站主在 Obsidian 维护的本地源文件。两边通过内容同步包建立共同基准，不把任一侧的变化静默覆盖到另一侧。

完成公开站切换后应另开隐私清理任务，把原始 Obsidian 副本从公开仓库当前版本移除。是否改写旧 Git 历史必须单独确认，不能自动 force-push。
