# 本地开发沙盒

用于隔离本地主题/界面开发。`feat/szweb-theme` 在第二阶段的安全环境上接入独立 szweb 主题；default / fuwari 仍可选。主题由忽略的 `.env.local` 中 `THEME` 决定，允许列表仅接受这三个已注册值。

## 启动

在仓库根目录运行（已初始化的机器只需最后一行）：

```powershell
node scripts/local-dev/run.mjs init
node scripts/local-dev/run.mjs install
node scripts/local-dev/run.mjs migrate
node scripts/local-dev/run.mjs seed
node scripts/local-dev/run.mjs start
```

地址为 `http://localhost:3000`。`bun run dev` / `bun run dev:local` 也会进入同一保护入口。启动前会离线编译翻译文件。

启动器需要 Node 24（seed 使用原生 TypeScript 支持）；本机版本为 24.13.0。停止服务使用终端 Ctrl+C。修改安全辅助脚本后必须重启，辅助目录被排除在热更新监视范围外。

Bun 使用用户级便携安装 1.4.2，默认寻找用户目录下 `.bun/codex-portable/1.4.2/bun-windows-x64/bun.exe`。已有其他位置时，可设置 `LOCAL_BUN_BINARY` 为完整路径。未更改系统 PATH。安装固定使用 `bun.lock`、`--frozen-lockfile --ignore-scripts`；仅安装步骤联网下载依赖及 SHA-256 固定的原项目翻译插件。运行、迁移、seed、检查均带网络保护。

## 数据和配置

- `wrangler.local.jsonc`：从经过审查的资源定义生成；全是假 ID、独立名称，无路由、Account ID、AI 或 remote 绑定。
- `.dev.vars`：随机生成的本地认证 secret 和假 OAuth 值。
- `.env.local`：主题选择、本地标志，关闭 Umami 与 Turnstile；本机当前为 szweb。
- `.wrangler/state-szweb/v3/d1`：本地 SQLite。
- `.wrangler/state-szweb/v3/kv`：应用缓存、Orama 搜索索引，及单独 OAUTH_KV。
- `.wrangler/state-szweb/v3/r2`：本地 SVG 图片。
- 同一 `v3` 下的 `do`、`workflows` 等：本地运行时状态。
- `.local-dev/home`：子进程的隔离用户目录、Wrangler/包管理器配置目录。
- `.local-dev/browser`：浏览器测试截图和 Network 记录。

这些机器数据均已加入忽略。不要提交本地状态、真实凭据或数据导出。

fixture 有 30 篇文章（25 已发布、3 草稿、2 未来发布）、20 条评论（含多级回复）、5 个 local.invalid 用户、5 条不同审核状态的友链、4 张自生成 SVG 和本地搜索索引。正文覆盖常见富文本结构。账号与专用测试密码定义在 `fixtures.ts`；仅在本机使用。

再次 seed 前先停止服务器。脚本只接受空数据库或匹配 fixture marker 的数据库；会重建指定假文章/账号、覆盖假图片，并清空该**本地专用 KV** 后重建搜索。需要保留的本地测试数据请先另存，marker 并不是备份机制。

fixture 使用 `smtp.local.invalid` 假邮件配置，让登录/注册表单显示；实际 SMTP 传输仍会被 mock 拒绝。注册邮件、真实 GitHub OAuth 均不属于本轮可用能力。测试用户已经写入本地库。

## 检查

```powershell
node scripts/local-dev/run.mjs check
node --test scripts/local-dev/guard.test.mjs
node scripts/local-dev/run.mjs typecheck
node scripts/local-dev/run.mjs lint
node scripts/local-dev/run.mjs test
node scripts/local-dev/run.mjs build
node scripts/local-dev/run.mjs smoke
node scripts/local-dev/run.mjs theme-smoke
node scripts/local-dev/run.mjs fold-smoke
node scripts/local-dev/run.mjs folio-smoke
```

浏览器检查使用已安装的 Playwright 与 Edge，独立临时浏览器上下文；不修改仓库依赖。其他机器可通过 `LOCAL_PLAYWRIGHT_PATH` 指向已有 Playwright 包。脚本记录请求、响应、错误及截图，并拒绝外部页面请求。

`folio-smoke` 验收折页 v2 的索引、年份分册、书签与纸边：数量从公开文章 API 核对，不写死示例年份；覆盖手机、深浅外观、语言切换、减少动态、无 View Transition API 与服务端渲染。结果和截图保存到 `.local-dev/fold-v2/acceptance/`。构建前先停止预览，构建后冷启动，再顺序运行浏览器回归。

## 折页 v2 的内容入口

- Header、六章导航和封底：`src/features/theme/themes/szweb/layouts/shell.tsx`。章节归属共用 `components/fold-navigation.ts`，文章详情归入文章，搜索、主题和友链归入索引。
- 纸页动效：`styles/motion.css`、`components/editorial-motion.ts`；Logo 与六色纸边：`styles/fold.css`。仅桌面且未要求减少动态时使用原生路由快照，其他环境保留直接导航和短暂显现。新索引、时间分册与封底版式在 `styles/folio.css`。
- 首页仍由 CMS 置顶与已发布文章策展，作者取后台站点设置。配色继续使用稳定 slug 和可选的 `_chroma:` 标签，内部标记不会成为公开主题。
- 索引 `/directory` 与时间 `/archive` 共享发布文章游标缓存，年份和数量来自内容；载入未完成时明确标注部分结果，失败可重试。年份入口直接展开对应分册。
- 项目仍由主题 `site.ts` 管理，保留当前内容；`relatedSlugs` 可关联 CMS 的已发布文章，`video` 可提供 `src`、`title` 和可选 `poster`。没有材料时不显示空视频或虚构手记，外部链接继续使用已有 `url`。

后台能力检查：当前 CMS 已支持文章置顶、标签配色和站点作者资料；首页封面映射、项目与项目关联还没有独立管理界面。未来可新增项目记录及项目—文章关联，再让首页选择、排序这些记录，并保留当前主题配置作为迁移兜底。本轮不新增数据库表或迁移，也不重做管理员界面。

压力场景：停止本地服务器后运行 `node scripts/local-dev/run.mjs seed-stress`，生成 250 篇本地文章（245 已发布、3 草稿、2 未来发布），含长标题、64 行代码、宽表格和多年归档。普通 `seed` 可恢复 30 篇，已知压力数据会分批清理；二者均要求原 fixture marker。测试产生的本地资料和评论可能被重建，勿用于保存实际创作。

`build` 仍使用同一隔离配置、mock 服务、离线翻译与外连拦截，只在 `dist` 生成本地构建产物；它不是可部署生产包。不要部署这些产物。开发工具默认关闭；真实生产配置和部署保持本阶段范围之外。

配置/环境检查采用严格允许列表：不明默认配置、生产域名、其他资源 ID、远程绑定、非预期持久化目录都会拒绝启动。启动器只传递必要环境变量，把用户目录重定向到本仓库；Node 侧拒绝外部 TCP/fetch，Worker 侧拒绝外部 fetch/重定向，页面 CSP 限制外部资源。AI 在 dev alias 中替换为 mock，SMTP 被禁用，邮件/webhook Queue 消息被确认并丢弃，OAuth/MCP 入口被拒绝。

这些是针对误操作的本地保护，不是防御恶意代码的操作系统沙盒。不要用真实凭据替换假值，不要绕过启动器。Cloudflare 图片变换、真实邮件、OAuth、AI 等能力本阶段不做端到端验证。

锁定的 workerd 最大支持兼容日期 2026-01-14，运行时会将配置中的 2026-02-17 回退到该日期；本轮未升级依赖。现有 fuwari 在保存深色偏好后整页刷新可能出现主题按钮属性的 hydration 警告，本轮只验收按钮切换后的暗色显示，未修改主题实现。开发期曾出现图片 500，重启后完整复测通过，旧错误的具体原因尚未证实。

为使登录页能完成 SSR，仅修正两处访问时机：登录页用路由的 `searchStr` 读取查询参数，社交登录的跳转 URL 在点击回调中计算；认证校验规则未改变。

保留的生产命令仅属于原仓库，不属于本流程；本阶段没有执行它们。未来部署、升级依赖、同步上游或修改本地允许列表都需要单独审查。
