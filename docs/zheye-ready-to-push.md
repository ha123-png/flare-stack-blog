# 折页 · 最终交付 / Ready to commit and push

> 后续更新（2026-10-01）：本文保留前一轮交付记录。当前工作区已继续完成「折页 v2」精修，包括正文翻页、右侧纸边藏色、索引、年份分册、章节书签和封底。当前内容入口与后台接入方案见 [本地开发说明](../scripts/local-dev/README.md)。v2 已通过类型检查、146 项单元测试、lint、本地 Client/SSR 构建，以及整站 40 场景/18 断言、折页 14 场景/45 断言、v2 36 场景/30 断言；三份浏览器报告的非预期错误均为 0。源码尚未 commit、push 或部署。

日期：2026-10-01（本地时间）\
工作区：`D:\个人博客\flare-stack-blog`\
分支：`feat/szweb-theme`\
状态：**READY TO COMMIT + PUSH — local acceptance passed**

本次交付的是现有 Git 工作区中的完整源码，不是一个替换原项目的孤立 HTML。没有 stage、commit、push、merge、deploy、远端迁移或生产资源写入。HEAD 保持 `fe7128e`。本地测试对隔离 fixture 数据有正常的评论创建与删除，不涉及生产数据。

## 最后一轮改动

1. **颜色属于文章，不属于搜索壳。** `articleChroma(slug, tags)` 优先采用经过白名单验证的 `_chroma:` 编辑标记；未配置文章按固定 slug 从六色盘中稳定取色。不依赖随机数、浏览器存储、公开标签顺序或列表位置。同一个 slug 在首页、文章索引、预览、快捷搜索、完整搜索、正文目录保持一致。修改标题不换色；修改 slug 会改变默认色，可用显式标记固定。内部标记仍不进入公开标签列表。
2. **六种低面积的材质色。** 深钴蓝、酒红、墨绿、石油蓝、暗紫、古金。深浅主题各自匹配；普通页面保持黑白，仅当前交互或阅读章节提示显色。搜索没有内容选中时保持中性边框，选中项的细线和搜索下沿才采用该文章颜色；不再固定橙红。
3. **目录舒展且不挤正文。** 1440px 实测目录由 154px / 11px 增至 288px / 15px，正文仍为 740px。层级用 16px 缩进，增加行距和章节间隔；当前章节只用一小段内容色。手机目录为 14px、最小 44px 点击区，仍采用折叠结构。无目录文章保留单列布局。
4. **搜索与浮纸收尾。** 快捷搜索最大宽度由 700px 收至 660px，输入区 62px 高、21px 字号；全文搜索路由和移动端入口保留。纸面采用下沿/侧边的轻阴影，不增加重阴影或持续动画。完整搜索补齐输入法 Enter 保护及键盘 focus 选中同步。
5. **提交命令可执行。** `.husky/pre-commit` 从依赖 PATH 中的 Bun，改为用现有 Node 运行项目已安装的同一个 Biome lint CLI；没有跳过或降低 lint 门槛。仅独立运行钩子验证，未执行 Git 提交或修改 Git hooks 配置。

本轮没有更换 Header、关于页结构、文章正文排版、业务 schema、认证服务或生产绑定。之前已完成的折页品牌、关于页、主题切换和项目舞台保留。验收中另修复了非 UI 文件触发的开发热更新问题：三个 Tailwind 入口只扫描 src，本地 watcher 排除 docs 和提交钩子，详见下方记录。

## 本轮验收证据

| 门槛 | 结果 |
| --- | --- |
| TypeScript | PASS |
| 单元测试 | 12 个文件、146 项 PASS，含 9 项身份/配色测试 |
| 原 Biome lint | 690 个文件，0 error，3 条原有 local-dev helper warning |
| Local-only guard | 3 项 PASS |
| Client + SSR 构建 | PASS |
| 整站 theme smoke | 40 个页面/尺寸场景、18 项交互断言 PASS |
| 折页交互 smoke | 14 次页面场景、45 项断言 PASS，含文档/钩子修改后的 SSR 回归 |
| 评论、账户、权限 | 24 项 PASS，0 runtime error、0 外部请求 |
| 阅读与表单 | 6 项 PASS；另严格检查 pageErrors、consoleErrors、外部请求均为空 |
| SSR 重复请求 | 3 篇文章共 6 次请求，加上首页前后各一次，均 HTTP 200，无服务端错误回退标记 |
| RSS / Atom / JSON Feed / sitemap / robots | 本地 HTTP 200，检查相应内容结构 |
| Git diff / 凭据模式 / 忽略项审查 | PASS；未发现凭据模式命中，临时文件及本地配置不在可提交清单 |

视觉实看包含桌面文章浮纸多色、深浅目录、深色搜索的中性与选中状态、手机目录，以及回归生成的各尺寸页面。减少动态效果、主题快速切换与无 View Transition API 降级、中文输入法、搜索失败重试、焦点返回都已覆盖。没有把静态构建成功代替浏览器验收。

### 对前次报错的处理

前次留下的报错没有混为一谈：搜索测试主动注入的 503 会产生资源错误和搜索错误日志，现将该故障窗口内的精确预期日志单独记录；SSR/pageerror 从不豁免。前一组回归通过后，写交接文档又触发 Tailwind 的广域源码扫描与 CSS HMR，随后首页出现 `serverFn is not a function`、HTTP 500。因此撤回了当时的 READY 状态，没有用之前的 PASS 掩盖新问题。

针对该触发条件，三个 Tailwind 入口都明确将 `source()` 限定到项目 `src`，仍覆盖所有主题和后台源码；local-only Vite watch 同时排除 `docs/` 与 `.husky/`，保留原有安全 deny/网络边界。新增回归会修改交接文档和提交钩子的文件时间、再次打开首页与正文，并核验文件字节没有改变。最终签收以此修复之后重新执行的整组报告为准。该修复约束了非 UI 文件触发热更新的边界，不声称已修复上游运行时所有源代码热更新场景。

修复后全套工程检查、40 场景的整站回归、45 项折页专项、24 项评论专项、6 项阅读表单专项重新通过。45 项专项包含上述非 UI 修改回归，预期注入的 2 次 503 与 4 条诊断单独记录；其余运行时错误与外部请求均为零。

开发时保持顺序：完成编辑 → 停止本项目预览 → 构建 → 冷启动 → 验收。不要在同一源码树同时跑构建、热更新和多组回归，再把受污染的开发进程当作最终样本。构建仍有既有大 chunk / 混合导入等 warning；没有以本地开发模式测试冒充生产性能指标。

## 文件与恢复

- 本轮改前快照：`.local-dev/final-20261001/before/`（774 个文件逐项 SHA-256 校验）。
- 最终源码快照及完整哈希清单：`.local-dev/final-20261001/ready-source/`、`ready-manifest.json`。
- 最终日志、结果汇总、变更清单：`.local-dev/final-20261001/`。
- 保留前次失败报告以便追溯，没有用新 PASS 报告抹去历史。
- 截图在该目录的 `screenshots/`，以及原回归目录 `.local-dev/szweb-qa/final/`。

这些私有测试与恢复目录均被 Git 忽略。必要的 `scripts/local-dev/` 安全开发代码应提交；`.env.local`、`.dev.vars`、`wrangler.local.jsonc`、`.wrangler/`、本地 fixture 存储和临时截图不得提交。

## 可复验命令

在项目根目录运行：

```powershell
node scripts/local-dev/run.mjs check
node scripts/local-dev/run.mjs typecheck
node scripts/local-dev/run.mjs test
node scripts/local-dev/run.mjs lint
node --test scripts/local-dev/guard.test.mjs
```

停止本项目预览后运行 `node scripts/local-dev/run.mjs build`；完成后在独立终端运行 `node scripts/local-dev/run.mjs start`，再依次运行 `node scripts/local-dev/run.mjs theme-smoke` 和 `node scripts/local-dev/run.mjs fold-smoke`。

## 提交与上线边界

**源码已可提交；尚未创建 commit，所以单独执行 `git push` 不会带走这些工作区改动。** 下一步是审阅本轮与先前主题实现的完整清单，stage、commit，再 push 当前功能分支。没有擅自改为 main，也没有验证远端凭据或触发生产部署。

生产构建仍需使用项目原有部署流程并选择内部主题键 `THEME=szweb`（对外站名是“折页”，主题键不改名）。本轮 `dist/` 是 local-only 构建验收产物，不要直接拿它上传为生产包；生产服务、数据库、凭据与部署配置由原有生产流程提供。本地隔离测试不声称真实 SMTP、OAuth、生产 Cloudflare 或所有后端业务均完成端到端测试。
