# szweb Theme · Design Integration Final

验收范围：`D:\个人博客\flare-stack-blog`，分支 `feat/szweb-theme`，LOCAL ONLY。设计母版：`D:\个人博客\szweb-blog-concept.html`。验收日期：2026-09-30。主题已实现并完成本地测试，供用户最终验收。

## 1. 完成内容

正式注册独立 `szweb` 主题，接入原 CMS 的文章、搜索、评论、账户、友链与站点文档能力。完成 Home、Articles、Archive、Search、Post、Tags、Projects / Project、About、友链列表及申请、五类认证页面、Profile，以及加载、空状态、错误和 404。

母版已先在浏览器体验；正式页面使用真实本地 CMS 数据与原业务 hooks，不以概念稿的数组或假提交代替业务。页面保持白色开场、深黑项目场景、白色文章索引、深黑页脚。所有数据来自专用本地 fixture；没有读取或更改生产文章。

## 2. 修改文件

| 文件组 | 用途 |
| --- | --- |
| `src/features/theme/themes/szweb/` | 新主题布局、页面、阅读渲染器、评论表现层、样式、配置、双语辅助与纯函数测试 |
| `public/themes/szweb/{atlas,field,forma}.svg` | 从母版提取的三个项目视觉，作为本地静态资源 |
| `src/features/theme/{registry,site-config.helpers}.ts`、`contract/` | 注册主题；增加可选页面组件和搜索失败重试 props；保持旧主题回退 |
| `src/routes/_public/{about,archive,tags,projects.index,projects.$projectId}.tsx` | 新路由、query 复用、metadata 与 canonical |
| 原首页、文章列表、搜索、用户 route、router、`__root.tsx` | 标签预取、清除筛选、搜索错误/键盘返回、主题错误页、可选开发工具 |
| `src/features/friend-links/` | 公开 DTO 只保留展示字段；限制网址协议；测试隐私裁剪与恶意 URL |
| default / fuwari 的 FriendCard 各一处 | 只调整公开数据类型引用，未改内部 UI |
| site-documents service、site-settings-section | 新页面进入 sitemap；后台解释主题配置入口 |
| `src/routeTree.gen.ts`、`src/lib/hono/path-manifest.generated.ts` | 由既有生成器更新路由清单 |
| `scripts/local-dev/`、`package.json`、`vite.config.ts`、`.gitignore` | 继承第二阶段本地隔离；新增安全 build、主题浏览器检查、压力 fixture |
| `docs/szweb-*.md` | 映射、能力矩阵、本报告、独立审查 |

工作区包含前一阶段尚未提交的安全开发改动，不能把全部 Git diff 都理解成本轮新写。两处既有认证 SSR 访问时机修复来自前阶段。完整路径以 `docs/szweb-change-inventory.txt` 为准。

## 3. 设计稿 → CMS 映射

详见 [实施映射](szweb-integration-map.md)。主要转换如下：

| 母版表达 | 正式实现 |
| --- | --- |
| Featured / recent writing | 原 pinned / recent / popular queries，真实发布时间、阅读时间和浏览量 |
| 先读一段 | 用户选中后才请求该文章正文，取前三个可读段落；桌面侧栏、手机内联；返回恢复选中项和滚动 |
| 年月归档 | 复用每批 50 篇的 cursor API，完整取完后给完整数量；加载中明确标为部分，失败可重试 |
| 全文搜索 | 原 Orama/KV 索引、真实高亮片段和标签；只解释安全的 `<mark>` 标记 |
| 项目场景 | theme-local typed config，组件不写死项目名称；详情页进入完整颜色 |
| 概念稿未画的账户/审核 | 接回原 schema、hooks、状态与角色权限，按同一视觉语言补齐页面 |

没有新增 D1 表、迁移、MCP 能力或生产资源，也没有重写 posts/auth 服务。

## 4. 原功能保留矩阵

完整矩阵见 [能力保留矩阵](szweb-capability-matrix.md)。

| 旧能力 | 新入口 | 状态与边界 |
| --- | --- | --- |
| 列表、置顶、热门、标签、cursor 分页、views | 首页 / 文章 | 已接通；真实分页、预览返回及 245 篇归档已验收 |
| 标题、摘要、日期、标签、复杂正文、目录、相关推荐 | 阅读页 | 已接通；H1–H3、列表、引用、表格、公式、代码、图片与 caption 保留 |
| 评论、回复、审核状态、作者/管理员删除 | 阅读页讨论区 | 使用原业务 hooks；最终流程结果见第 15 节 |
| 全文搜索与键盘操作 | 一级导航、Ctrl/Cmd+K | 已接通；输入焦点、方向键、Enter、Esc、清除、零结果、失败重试已验收 |
| Login / Register / Forgot / Reset / Verify | 账户入口与原路由 | 全部存在；真实本地密码登录通过；邮件发送和远端 OAuth 受本地保护禁用 |
| Profile / 改密 / 通知偏好 / logout | 账户菜单 | 资料保存及恢复、手机布局、退出和登录门禁通过；通知按原 availability 显示 |
| 友链、申请与本人审核记录 | 页脚、友链页、账户菜单 | 真提交为 pending，刷新保持；公开列表不展示待审核申请 |
| 管理后台和编辑入口 | 管理员账户菜单、文章编辑入口 | 角色入口保留；原后台能够保存本地站点设置 |
| RSS / Atom / JSON Feed / sitemap / robots / manifest | 页脚与原地址 | 六个本地端点均 HTTP 200；新页面进入 sitemap |
| 中英界面 / light-dark-system | 外观菜单 | 英文切换、暗色刷新保持、手机导航均通过；用户内容不自动翻译 |

## 5. 新增能力

新增独立归档、主题索引、项目目录及详情、About。阅读页补上安静的阅读进度、字号控制、图片原图查看、代码复制反馈；搜索增加统一的故障重试；表单和弹窗补齐焦点、Escape 与错误反馈。

公开友链接口不再暴露联系邮箱、提交人身份、审核原因等非公开字段；旧缓存也经公开 schema 重新裁剪。统计请求同时遵守 50 条 API 限制与 512 字节 UTF-8 缓存键限制。

## 6. 删除 / 合并的概念稿元素

删去假文章计数、假搜索数据、假评论提交和仅保存草稿的假友链流程，改用真实业务状态。合并重复说明、装饰性标签和次要操作；没有封面的文章用纯排版呈现，不虚构图片。没有 URL 的概念项目只提供真实内部详情页，不生成无效外链。

保留 CMS 能力，放弃旧主题的大 Banner、侧栏卡片和旧导航。没有为了兼容而复制旧布局。

## 7. 二次设计改进

对照母版截图后收紧索引页的重复顶部留白，统一页面标题、表单字体和细线层级。搜索去除浏览器自带的蓝色清除控件，保留清楚的下划线焦点。预览从摘要升级为按需读取的正文段落。弹窗 portal 补上主题色，深色模式下不掉回旧样式。

独立审查指出的两点已纳入末轮精修：本地站点标题、作者与描述统一为 szweb 品牌；平板和手机的回顶按钮移到文章末尾，避免压住正文，阅读进度改为顶部细条。进度使用语义化 progressbar，不在每次滚动时触发 live-region 播报。

## 8. Responsive 策略

| 模式 | 排版方式 |
| --- | --- |
| 桌面 | 索引行与预览侧栏；项目文字/视觉分列；阅读目录在侧面 |
| 平板 | 收紧导航；项目重新分配比例；目录折叠进入正文前；进度使用顶部条 |
| 手机 | 全屏黑色导航；项目横向选项；预览在列表内；标签自然换行；表格与代码仅在自身区域横向滚动 |

首页覆盖 1440、1280、1024、768、430、390、360、320 八档宽度。主要索引和复杂正文另做 390/320 检查，768 单独检查首页和阅读页。压力数据含 250 篇文章，其中 245 篇可公开，另有草稿和未来发布文章；纯函数额外覆盖 1,000 篇归档与长 Unicode slug。

## 9. Chroma 实现

浅色背景 `#FFFFFF`，主深色 `#080808`，项目与页脚深黑层级为 `#050505` / `#080808`。UI 本身保持黑白，真实正文图片保留自身色彩。

项目默认灰度；hover / focus / active 仅在图片底部显出 14% 色彩，详情页完整显彩。浏览器实测灰度滤镜为 `grayscale(1)`，发现态裁剪为 `inset(86% 0 0)`。配色来自明确的项目配置，未采用随机颜色或图片平均色。`_chroma:*` 从公开标签展示中排除；未添加数据库 accent 字段。文章编辑配图映射目前为空，普通文章没有合成 accent。

## 10. 测试

| 检查 | 结果 |
| --- | --- |
| TypeScript | 通过 |
| Unit | 137 项 / 11 文件通过 |
| 本地 guard | 3 项通过 |
| Lint | 0 error；3 条既有 local-dev helper 风格 warning |
| 本地 client + SSR build | 通过；使用隔离配置和 mock，产物不用于生产部署 |
| 公开浏览器 | 40 次页面/宽度访问，18 项交互与安全断言通过；0 runtime error、0 外部请求、无页面横溢出或坏图 |
| 账户浏览器 | 资料持久化/恢复、真实申请、审核隔离、角色入口、退出与手机布局通过 |
| 评论浏览器 | 24 项通过：管理员/读者身份、多级回复、插入弹窗、删除确认/焦点、本人/他人权限、手机和退出；0 runtime error、0 外部请求 |
| Luna 读页与表单 | 6 项通过：正文、桌面目录、代码复制、登录/注册/找回密码空表单校验；0 console/page error、0 外部请求 |
| 补充状态 | 搜索加载、人工本地 503 故障与重试恢复、零结果、404、reset/verify 无效链接、暗色正文 |

曾发现并已修复富文本 `<table><tr>` 的 hydration 问题、多篇长 slug 造成的 KV key 414，以及管理员登录态阅读页编辑入口的 SSR 差异。修复后严格复测通过。开发中的广泛 HMR 更新曾导致 serverFn 映射失效，冷重启后重新验收；最终证据取自稳定服务。早期有缺陷的测试脚本报告保留为 obsolete，最终依据为明确 PASS 的报告；测试没有把编辑器草稿当作已发布评论。

没有把原 Cloudflare 集成测试、真实 SMTP/OAuth/AI/图片变换的远端端到端测试记作通过。

## 11. 性能

把富文本阅读器和评论编辑器从主题入口拆到阅读路由懒加载。初次整体导入时主 JS gzip 为 569.74 kB；拆分后约 246.87 kB，减少约 57%。以最终 build log 中的主入口为准，`dist` 中旧构建残留文件不代表当前入口。

图片有固有尺寸和 lazy loading；预览只在选中时读取；归档分页串行；滚动监听为 passive + requestAnimationFrame；动效以 opacity/clip 为主，reduced-motion 下关闭。没有 WebGL、视差循环、实时 blur 或外部字体请求。

本机开发模式暖首页一次观察到 LCP 336 ms、CLS 0；重启后的首次正文包含 Vite 编译，观察到 LCP 21.68 s、CLS 0.00053。这些不是生产性能分数，也没有做真机弱网认证。最终主 JS 为 `main-9ahOOk_x.js`（867.30 kB / gzip 246.87 kB），主 CSS 为 `main-B3kgJ-xf.css`（479.94 kB / gzip 128.23 kB），仍包含共享 CMS/编辑器样式；大 chunk 警告仍存在，应在未来生产配置下单独测量和优化。

## 12. Accessibility

提供 skip link、语义标题、表单 label/错误关联、focus-visible、44px 级主要触摸目标。手机原生 dialog、评论插入/删除确认和图片查看支持焦点约束、Escape 与关闭后的焦点恢复。项目 tabs 支持方向键/Home/End；搜索使用 combobox/listbox 与 active-descendant；目录有当前位置反馈。

实测 reduced-motion 下没有运行中的页面动画，内容显彩可通过键盘焦点发现。语义与键盘基础检查通过；没有声称完成专业屏幕阅读器全量审计或 WCAG 认证。

## 13. Astra 自评

**YES。** 仅看最终站点，我会把它视为完整、成熟、高端的个人博客产品。信息入口以文章和阅读为中心，深黑项目场景有节奏地出现，颜色只在内容中展开。真实的列表、搜索、归档、身份与审核状态已融入同一套设计，而不是在漂亮首页后面接回旧模板。这个设计判断不等于生产部署许可；数据与远端服务验证边界见第 18 节。

## 14. Luna Max 独立设计 QA

独立 6 Luna Max 的设计结论为 **YES**：对照母版和规定的桌面、手机、平板、暗色及英文截图后，认为“整体会被我视为成熟的高级个人博客产品”。其提出的示例品牌不一致、手机回顶遮挡已处理；暗色长图已在加载完成后重新截图确认。完整依据见 [独立验收](szweb-independent-qa.md)。

## 15. Luna Max Regression QA

独立审查最终结论为 **CAPABILITY REGRESSION PASS · LOCAL ENGINEERING PASS · PRODUCTION SAFETY PASS**；没有阻塞本地验收的问题。该结论限定于下述已测流程与明确列出的本地验证边界。

独立检查以原 contract、业务源码和 [能力矩阵](szweb-capability-matrix.md) 为准。Luna 的阅读/表单测试 6/6 PASS；主负责人的真实评论测试 24/24 PASS，账户/友链 12 项检查通过，另存证据供独立审查复核。覆盖管理员和读者真实身份、发表后查询到的评论行、多级回复、删除取消/确认、本人删除与他人保护、退出后的登录提示。邮箱投递、远端 OAuth 和不可用通知开关明确不作为本地 E2E 通过项。

## 16. 截图与证据路径

根目录：`D:\个人博客\flare-stack-blog\.local-dev\`。

| 目录 | 内容 |
| --- | --- |
| `concept-review/` | 母版原始浏览器体验截图 |
| `szweb-qa/final/` | 正式主题桌面/手机/平板，深色、英文、菜单、预览；`browser-report.json` |
| `szweb-qa/supplemental/` | 故障恢复、空状态、404、无效认证链接、显彩、深色阅读；`supplemental-report.json` |
| `szweb-qa/account/` | 资料、申请、登录门禁；`account-report.json` |
| `szweb-qa/product/` | Luna 阅读/表单 `report.json`；真实评论 `comments-report.json`；线程、手机与深色弹窗截图 |
| `build.log`、`theme-smoke.log`、`server.log` | 构建、严格主题浏览器、当前服务日志 |

截图是本地验收资料，不提交浏览器 cookie、token 或凭据。代表文件包括 `home-1440-viewport.png`、`home-390-viewport.png`、`articles-preview-1440.png`、`post-768-viewport.png`、`navigation-390.png`。

## 17. 当前 Git status

当前分支 `feat/szweb-theme`。`HEAD`、本地 `main`、本地记录的 `origin/main` 均为 `fe7128e33ba4baceb7220bad59cbcfee09e1cb97`；未创建提交，未推送、合并、部署或同步 upstream。修改与新增文件保留在工作区供审核，`git diff --check` 通过。

使用专用 `wrangler.local.jsonc` 和 `.wrangler/state-szweb`；local health 显示 `localOnly: true`、AI mock、SMTP/OAuth/webhook disabled。没有运行 remote migration，也没有访问生产 D1/R2/KV。本地站点设置保存和测试评论/友链仅写入本地 fixture。

## 18. 尚未完成 / 风险

1. 生产配置、域名资源、部署、真实邮件/OAuth/AI/图片变换均未启用或验收；这是本阶段明确边界。
2. 项目 Atlas / Field / Forma 仍是可替换的母版示例配置，状态明确为概念研究或实验；尚未录入你的实际项目。正文为本地压力测试内容，非生产内容迁移结果。
3. 原后台设置页直接刷新观察到 Breadcrumbs hydration 警告；相关后台组件未改动，尚未证明其是否在基线稳定复现。它与新主题公开/用户页面的零错误结论分开记录。后台保存本地设置正常。
4. 依赖锁定的 workerd 会把兼容日期回退到 2026-01-14；未为本主题顺手升级依赖。构建的大 chunk、gray-matter eval 等既有依赖警告保留。
5. 单个超过 KV key 容量的历史超长 slug 会沿用原服务无缓存回退；主题已解决多条正常 slug 合并导致的超限，未更改共享统计服务。
6. 本地保留一条审核中的验收友链，以及验收生成的评论、回复和删除占位；测试昵称已还原。后续重建 fixture 会按本地辅助脚本规则重建测试数据，不能把它当真实创作库。

最终状态：可供用户本地验收。预览地址为 `http://localhost:3000`，当前服务保留运行；没有执行 push / merge / deploy。
