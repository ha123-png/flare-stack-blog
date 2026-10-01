# szweb Final Visual Polish · Push Readiness

> 历史阶段记录。此处的待办状态保留作追溯；最新「折页」最终验收、已补齐的 lint 门槛和提交说明见 [zheye-ready-to-push.md](./zheye-ready-to-push.md)。

日期：2026-10-01（本地时间）\
分支：`feat/szweb-theme`\
状态：**READY FOR FINAL HUMAN REVIEW — lint gate pending**

这是本轮视觉精修的交接记录，不替代此前的功能实现文档。没有执行 stage、commit、push、merge、deploy 或远端迁移。不能将本记录解释为全部发布门槛已通过。

## 本轮实际变化

- 按 display / page / section / article / summary / UI / meta / micro 建立字号角色。1440px 首页实测标题 48→68px、摘要 13→16px、导航 12→14px；手机独立缩放。保留 Post 原有大标题和阅读正文尺度。
- 首页使用更明确的不对称构图、大小标题对比和主次列表节奏；文章索引、搜索、时间、标签、项目、关于、登录与友链同步调整字号及间距，不改成卡片博客。
- 路由使用 280ms 纯淡入，不重挂载页面，不在整个 main 上做 transform，避免固定阅读工具被重新定位。下方少量板块进入视口时只演出一次。导航使用一条移动的 active rule；菜单、预览与按钮采用短反馈。
- 项目区保留左选择、右视觉的黑场。三张图在同一固定画布中切换，链接和选中态立即更新，画面短暂淡入/小幅定向位移。未增加动画库、持续 RAF、循环扫光或图片 zoom。
- 默认黑白；hover / focus / 明确选择后，以右侧不对称斜切露出约三分之一彩色，搭配一小段对应色选择线。项目详情仍可完整显色。
- 中文导航改为“时间”，页面 label 为“时间索引”，标题及 SEO 名称为“历年文章”。英文 Archive 和 `/archive` 地址不变。
- 手机文章日期移到标题上方；重复计数保留为无障碍播报而不重复占屏；标签搜索与标签区标题同行。正文页阅读按钮移除原有负边距，改成独立布局，点击区 44px。
- 平板项目区预留最高说明所需空间。实际从 Atlas 切到 Forma / Field 时黑场均为 582px，画布均为 458×305.328px；不再带动下面的文章区跳动。

## 文件范围

新增主题文件：

- `src/features/theme/themes/szweb/styles/editorial.css`
- `src/features/theme/themes/szweb/styles/motion.css`
- `src/features/theme/themes/szweb/components/editorial-motion.ts`

精确修改原主题文件：`index.ts`、`layouts/shell.tsx`、`components/project-stage.tsx`、`pages/archive.tsx`。

主题之外只调整 `src/routes/_public/archive.tsx` 的中文标题，以及 `scripts/local-dev/szweb-smoke.mjs` 对应的完整时间索引文案断言。构建照常生成项目既有 generated 文件。本轮没有改业务 schema、认证核心、生产绑定或安装新依赖。

整个 szweb 主题在开始时已经是 Git untracked，不能把 `git status` 中整个主题目录都算成本轮新增。其他大量已有未提交实现均保留，未 reset/discard。

## 已执行验证

| 项目 | 当前结果 |
| --- | --- |
| TypeScript typecheck | PASS |
| 单元测试 | 11 文件、137 测试 PASS |
| local-only guard | 3 测试 PASS |
| 本轮相关文件格式检查 | PASS；最终 CSS 亦已格式化 |
| Client + SSR 最终构建 | PASS，最终日志见下方 |
| 最终 theme-smoke | 40 次页面/尺寸检查、18 项断言 PASS |
| 阅读/表单专项 | 6 项 PASS，console/page/request/external error 均为零 |
| 评论/账户专项 | 24 项 PASS，runtime error 和外部请求均为零 |
| git diff --check | PASS；没有 staged 文件 |
| lint | **未执行成功：工具安全检查拦截，不能记作 PASS** |

最终基础浏览器回归始于 `2026-09-30T17:08:24.192Z`，覆盖 1440/1280/1024/768/430/390/360/320，包含真实 cursor pagination、置顶/热门内容、245 篇本地已发布测试文章的时间索引、真实正文预览与返回恢复、键盘搜索、菜单焦点、语言和深浅色持久化、复杂正文与断图/横向溢出检查。

阅读专项实测目录滚动、准确代码复制、登录/注册/找回密码空表单校验，不发送邮件。评论专项使用原有本地测试账户，验证管理员/普通用户权限、个人页面、管理员入口、嵌套回复、弹窗焦点、取消/Escape、仅删除本次测试评论，以及手机评论区。测试结束登出，没有操作真实账户。

额外核对：RSS、Atom、JSON Feed、sitemap、robots 返回 200；XML 可解析，JSON Feed 使用原生 JSON 解析核对版本字段及 100 条条目。无效页面返回 404；reset-link / verify-email / submit-friend-link 页面返回 200。HTTP 成功不等于验证了真实邮件/OAuth交付，后两者仍按 local-only 禁用。

人工浏览器补验：项目方向键改变选择且只有一个 tab stop；减少动态效果时 slide/color transition 均为 0s、运行中动画为零，选择和链接照常；平板正文图片灯箱正常解码、打开时锁滚动并聚焦关闭按钮，Escape 关闭后解除滚动锁并归还触发器焦点。

## 证据位置（相对项目根目录）

- `.local-dev/polish/build.log`
- `.local-dev/szweb-qa/final/browser-report.json`
- `.local-dev/polish/reading-auth-report.json`
- `.local-dev/polish/comments-report.json`
- `.local-dev/polish/routes-report.json`
- 最终截图：`.local-dev/szweb-qa/final/`，重点 `home-1440-viewport.png`、`home-390-viewport.png`、`articles-390-viewport.png`、`post-390-viewport.png`、`post-768-viewport.png`、`home-dark-1440.png`、`navigation-390.png`。
- 项目显色截图：`.local-dev/polish/project-hover-desktop.png`。

`.local-dev`、`.env.local`、`.dev.vars`、`wrangler.local.jsonc` 均已通过 `git check-ignore` 确认忽略。主题文件未发现 console.log、localhost 硬编码、真实密钥模式或 Windows 绝对路径；两个宽泛路径正则匹配实际为 https URL。

## 已知限制与下一步门槛

1. **lint 仍是发布前待补门槛。** 当前不能宣称 READY TO PUSH。保留项目原有命令 `node scripts/local-dev/run.mjs lint`，不降低 lint 规则，不绕过安全检查。视觉确认与 lint 通过后才讨论 commit/push。
2. 本地开发期间，在 CSS HMR / 资源重新生成后两次遇到 SSR `serverFn is not a function`（置顶/热门查询）。停止本地预览、构建、冷启动且不再修改源码后，最终整站和专项回归均通过。未确认根因或修复上游运行时；不要把冷启动通过写成 HMR 已修复。后续构建应先停止该项目预览，完成后冷启动，而不是与开发服务并行生成资源。
3. 构建仍报告现有大 chunk、静态/动态导入混用、第三方 eval 等警告；开发运行时仍有 compatibility date 回退提示。本轮未升级依赖，也没有做全设备 FPS 或真实线上性能承诺。
4. 未实际执行独立 Luna 审查，不能沿用旧版双模型认可作为本轮证明。设计仍需用户亲眼确认；优先看首页标题与留白比例、项目局部显色、手机列表密度。
5. 核对发现最初 `.local-dev/polish/baseline` 目录为空，**不能作为改动前备份**。已另建完成态 `.local-dev/polish/completed-theme-20261001`，50 个主题文件逐一 SHA256 对齐；另保存完成态 archive route / smoke 脚本。这是当前状态快照，不是旧版回滚点。

## 交接

本地预览保留在 `http://localhost:3000`。最终 Git 仍为原分支上的未提交工作区。先完成视觉人工验收及未通过的 lint 门槛，再选择实际应提交的既有实现和本轮文件；不要直接把本地测试截图、状态目录、凭据或构建输出打包提交。

**READY FOR FINAL HUMAN REVIEW**
