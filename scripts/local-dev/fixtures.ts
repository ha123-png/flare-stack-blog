export const FIXTURE_MARKER = "flare-stack-blog-fixtures-v1";
export const FIXTURE_TEST_PASSWORD = "LocalFixture-Only-2026!";

export const FIXTURE_USERS = [
  {
    id: "local-fixture-admin",
    name: "Mori Lin",
    email: "admin@local.invalid",
    role: "admin",
  },
  {
    id: "local-fixture-writer",
    name: "林间笔记",
    email: "writer@local.invalid",
    role: null,
  },
  {
    id: "local-fixture-reader-a",
    name: "June Chen",
    email: "june@local.invalid",
    role: null,
  },
  {
    id: "local-fixture-reader-b",
    name: "River Wu",
    email: "river@local.invalid",
    role: null,
  },
  {
    id: "local-fixture-reader-c",
    name: "Alex North",
    email: "alex@local.invalid",
    role: null,
  },
] as const;

export type FixtureArticle = {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  status: "published" | "draft" | "scheduled";
  publishedDaysAgo?: number;
  futureDaysFromNow?: number;
  pinnedDaysAgo?: number;
  views: number;
  readTime: number;
  contentMode?: "archive-stress";
  opening: string;
  detail: string;
  takeaway: string;
};

export const FIXTURE_ARTICLES: FixtureArticle[] = [
  {
    slug: "edge-blog-in-a-weekend",
    title: "把个人博客搬到边缘运行",
    summary:
      "一次小型迁移记录：把文章、图片和搜索索引放进边缘环境，同时让本地开发继续保持可预测、可重复。",
    tags: ["Cloudflare", "TypeScript", "建站"],
    status: "published",
    publishedDaysAgo: 1,
    pinnedDaysAgo: 8,
    views: 128,
    readTime: 7,
    opening: "我想要一个打开很快、维护简单、可以慢慢长大的个人空间。",
    detail:
      "迁移时先把静态内容与运行时数据分开，再逐步替换存储接口。每一步都保留一条本地回退路径，因此上线前可以在隔离环境里检查文章、图片和搜索。",
    takeaway:
      "把部署边界画清楚之后，所谓边缘运行就不再像一次大手术，而更像一组可以验证的小改动。",
  },
  {
    slug: "quiet-system-for-notes",
    title: "A Quiet System for Personal Notes",
    summary:
      "A small note system should make capture easy, keep retrieval predictable, and stay out of the way when you are writing.",
    tags: ["Writing", "Workflow", "生活"],
    status: "published",
    publishedDaysAgo: 3,
    pinnedDaysAgo: 3,
    views: 96,
    readTime: 5,
    opening:
      "The best archive is the one that quietly returns a useful thought at the right moment.",
    detail:
      "I keep capture friction low and add structure only when a note starts connecting to other work. Search, a few durable tags, and a weekly review are enough for this sample collection.",
    takeaway:
      "A tool earns its place by helping the next small decision, not by collecting the most metadata.",
  },
  {
    slug: "chinese-search-index",
    title: "在搜索框背后：中文分词与轻量索引的取舍记录",
    summary:
      "从中文分词、字段权重到压缩后的本地 KV 持久化，记录一个小型博客搜索索引如何保持轻快。我们会用几个可重复的例子检查标题、摘要、正文与标签的匹配表现，也看看空摘要和中英混排会怎样影响结果。",
    tags: ["搜索", "数据库", "TypeScript"],
    status: "published",
    publishedDaysAgo: 5,
    views: 74,
    readTime: 8,
    opening:
      "搜索体验通常不是由一个复杂算法决定的，而是由很多细小选择叠加而成。",
    detail:
      "把标题、摘要、正文和标签放入同一个轻量索引，可以让离线演示保持简单。中文 tokenizer 把连续文本切成词，再用真实文章建立一份可以直接加载的快照。",
    takeaway: "索引版本号和数据一起保存，可以让应用清楚知道何时需要重新载入。",
  },
  {
    slug: "slow-afternoon-walk",
    title: "慢一点",
    summary: "",
    tags: ["生活", "摄影", "随笔"],
    status: "published",
    publishedDaysAgo: 7,
    views: 62,
    readTime: 3,
    opening: "午后的路没有目的地，只有树影一点一点挪过墙面。",
    detail:
      "我把手机收起来，沿着熟悉的街区多走了两个路口。声音变少以后，风吹过行道树的节奏反而清楚起来。",
    takeaway: "空出来的时间不一定要被填满，它也可以只是一天里的一段留白。",
  },
  {
    slug: "small-css-archive",
    title: "A Small CSS Archive for Curious Browsers",
    summary:
      "Notes on tiny interface details: a softer focus ring, a resilient card grid, and a motion setting that respects the reader.",
    tags: ["CSS", "Design", "Web"],
    status: "published",
    publishedDaysAgo: 9,
    views: 49,
    readTime: 4,
    opening:
      "A small archive is a good excuse to notice the details we normally scroll past.",
    detail:
      "The examples stay intentionally plain: readable color contrast, a grid that narrows gracefully, and transitions that can be disabled without breaking the layout.",
    takeaway:
      "Good interface polish is often the removal of one unnecessary surprise.",
  },
  {
    slug: "reading-notes-checklist",
    title: "用一张清单写出不僵硬的读书笔记",
    summary:
      "把摘录、疑问和自己的回应放到同一页；阅读结束后再决定哪些句子值得带进下一篇文章。",
    tags: ["阅读", "Writing", "Workflow"],
    status: "published",
    publishedDaysAgo: 12,
    views: 43,
    readTime: 5,
    opening: "做读书笔记不必把一本书复述一遍，留下思路的转折点就足够。",
    detail:
      "我给每章只留一个摘录、一条疑问和一个自己的回应。这样的限制减少了复制粘贴，也让后来回看时更容易找到真正被改变的想法。",
    takeaway: "笔记的价值常常在阅读结束后的那次连接，而不是当时记下了多少行。",
  },
  {
    slug: "blue-roof-weekend-photos",
    title: "周末拍下的蓝色屋顶",
    summary: "一组沿河散步的照片，以及为什么我开始给每张图片写一句具体的说明。",
    tags: ["摄影", "生活", "Accessibility"],
    status: "published",
    publishedDaysAgo: 15,
    views: 38,
    readTime: 3,
    opening: "河边那排旧仓库在阴天里有一种很安静的蓝色。",
    detail:
      "回家整理照片时，我试着不只写颜色，而是描述画面里发生了什么。具体的替代文字既能帮助读者理解图片，也让我更容易记起拍摄时的光线。",
    takeaway: "图像说明不是额外的装饰，它是照片进入故事的入口。",
  },
  {
    slug: "sqlite-small-data",
    title: "SQLite 是如何留住小数据的",
    summary:
      "用几张本地表演示文章、标签、评论和浏览记录之间的关系，顺便记下测试数据如何保持可重复。",
    tags: ["SQLite", "数据库", "Local Dev"],
    status: "published",
    publishedDaysAgo: 18,
    views: 35,
    readTime: 6,
    opening: "小型网站的数据模型，最好从读者真正会做的动作开始理解。",
    detail:
      "文章和标签是多对多，评论则围绕文章形成回复树，浏览记录记录每次匿名访问。把这些关系摊开之后，迁移和测试都更容易讨论。",
    takeaway: "稳定的 fixture 不是一次性截图，而是系统行为可以重复出现的条件。",
  },
  {
    slug: "ai-as-draft-partner",
    title: "AI 作为草稿伙伴，而不是作者",
    summary: "我把重复的整理步骤交给工具，把事实、判断与最后的语气留给自己。",
    tags: ["AI", "Writing", "工具"],
    status: "published",
    publishedDaysAgo: 21,
    views: 31,
    readTime: 5,
    opening: "工具很擅长把一堆材料变得有形，却不会替我决定什么值得留下。",
    detail:
      "在这组虚构示例里，助手负责归类、提问和找出空白。作者自己补上亲身经验，核对事实，再决定是否接受建议。",
    takeaway: "把工具的工作说清楚，也就更容易看清人的责任在哪里。",
  },
  {
    slug: "code-blocks-as-tutorials",
    title: "把代码块变成可以跟着做的小教程",
    summary:
      "代码示例前后各留一句解释，再配上输入与预期输出，让读者不必猜每一行要解决什么。",
    tags: ["TypeScript", "教程", "Writing"],
    status: "published",
    publishedDaysAgo: 24,
    views: 29,
    readTime: 6,
    opening: "一段代码如果没有上下文，读者只能看到字符，无法看见选择。",
    detail:
      "我先描述一个具体触发场景，再给出短代码片段，最后解释如何判断结果正确。这个节奏让示例既可以复制，也可以被修改。",
    takeaway: "好的教程把隐含的判断过程也写出来。",
  },
  {
    slug: "ten-minute-breakfast",
    title: "我的 10 分钟早餐",
    summary:
      "燕麦、苹果和一点点肉桂；一个不需要漂亮摆盘，也能让早晨慢下来的日常记录。",
    tags: ["生活", "食谱", "随笔"],
    status: "published",
    publishedDaysAgo: 28,
    views: 26,
    readTime: 2,
    opening: "厨房窗台接到第一束光的时候，水壶刚好烧开。",
    detail:
      "我把燕麦和牛奶放进小锅里，切一只苹果，最后撒上一点肉桂。十分钟足够做完，也足够让脑子从睡意里醒来。",
    takeaway: "可重复的简单事情，会替忙碌的早晨留出一些余地。",
  },
  {
    slug: "keyboard-shortcuts-field-guide",
    title: "A Field Guide to Keyboard Shortcuts",
    summary:
      "A practical list of shortcuts I use every day, grouped by task instead of by application menu.",
    tags: ["Tools", "效率", "Web"],
    status: "published",
    publishedDaysAgo: 32,
    views: 24,
    readTime: 4,
    opening:
      "Shortcuts are useful only after the task becomes familiar enough to deserve one.",
    detail:
      "I group commands around navigation, selection, and recovery. The guide uses a fictitious local workspace, so every example is safe to try without connecting an account.",
    takeaway:
      "Learn one shortcut at a time and let repetition do the teaching.",
  },
  {
    slug: "alt-text-notes",
    title: "被忽略的 alt 文本：让图片也能参与叙事",
    summary:
      "从空白占位词到有上下文的图像描述，练习在准确、简短和不重复之间找到平衡。",
    tags: ["Accessibility", "摄影", "设计"],
    status: "published",
    publishedDaysAgo: 36,
    views: 22,
    readTime: 5,
    opening: "替代文字要回答的是图片给这段内容带来了什么。",
    detail:
      "如果图片已经在正文附近被完整解释，替代文字就不用重复整段说明。若图里有流程或关系，则可以简洁说明其结构。",
    takeaway: "描述图片时，先想象读者此刻少看到了什么。",
  },
  {
    slug: "gentle-publishing-workflow",
    title: "从草稿到发布：一个没有催促感的工作流",
    summary:
      "用草稿、预览、排期和发布四个状态整理写作节奏，让文章在准备好之后再出现。",
    tags: ["Workflow", "Writing", "建站"],
    status: "published",
    publishedDaysAgo: 40,
    views: 20,
    readTime: 6,
    opening: "把发布过程拆成几步，写作就不再像一个必须一次完成的任务。",
    detail:
      "草稿可以保留未完成的想法，预览用于检查链接与版面，未来日期则让安排好的文章稍后公开。每种状态都代表清楚的读者可见性。",
    takeaway: "状态清晰以后，创作者可以按自己的节奏工作。",
  },
  {
    slug: "weekly-plan-heatmap",
    title: "画一张一眼能读懂的周计划热力图",
    summary: "把每天的写作时段记成柔和色块，观察节奏而不是给自己打分。",
    tags: ["数据可视化", "效率", "CSS"],
    status: "published",
    publishedDaysAgo: 44,
    views: 18,
    readTime: 4,
    opening: "一周的记录适合用来发现规律，而不是评判哪一天过得够不够好。",
    detail:
      "我用七列代表星期、四行代表不同时间段，再按实际投入填上浅色。空白格也保留着，它们不需要被解释成失败。",
    takeaway: "可视化只负责让模式更容易被看见，意义仍要由人来决定。",
  },
  {
    slug: "local-development-boundary",
    title: "给本地开发搭一条看得见的安全边界",
    summary:
      "固定本地配置、持久化目录和虚构账号，再把外部请求挡在 Worker 入口之外。",
    tags: ["Local Dev", "Cloudflare", "安全"],
    status: "published",
    publishedDaysAgo: 48,
    views: 17,
    readTime: 7,
    opening:
      "本地调试也会接触真实环境变量，所以最先要做的是减少它们的可见范围。",
    detail:
      "这个示例通过显式配置选择本地 D1、KV 和 R2，并把 Wrangler 的用户目录隔离开。脚本只接受白名单中的本地资源。",
    takeaway: "边界越明确，fixture 就越适合反复运行和分享。",
  },
  {
    slug: "three-cards-cache-question",
    title: "三张卡片解开一个缓存问题",
    summary:
      "把缓存键、版本号和过期时间写在便签上，找到文章详情页为什么没有更新。",
    tags: ["缓存", "TypeScript", "调试"],
    status: "published",
    publishedDaysAgo: 52,
    views: 16,
    readTime: 4,
    opening: "我先画了三张卡片：内容、版本和读取路径。",
    detail:
      "卡片之间的箭头提醒我，数据库更新成功并不代表读者马上读到新内容。失效通知必须覆盖实际使用的键。",
    takeaway: "可视化状态流转，常常比多加一层日志更快。",
  },
  {
    slug: "browser-as-publishing-studio",
    title: "The Browser Is a Tiny Publishing Studio",
    summary:
      "A tour of the small tools that make a browser feel like a comfortable writing desk: preview, search, archive, and notes.",
    tags: ["Web", "Writing", "Design"],
    status: "published",
    publishedDaysAgo: 56,
    views: 15,
    readTime: 5,
    opening:
      "A publishing space can be calm even when its implementation has many moving parts.",
    detail:
      "I keep the reader-facing surface focused on the current story, then make archives and search easy to reach. The admin side can carry the controls without crowding the article.",
    takeaway:
      "A good browser workspace helps the writer and reader keep different kinds of attention.",
  },
  {
    slug: "rainy-day-photo-archive",
    title: "雨天整理相册的四个步骤",
    summary:
      "先挑出重复照片，再记下地点、光线和同行的人，最后把值得分享的画面写成一段小故事。",
    tags: ["摄影", "生活", "Workflow"],
    status: "published",
    publishedDaysAgo: 60,
    views: 14,
    readTime: 4,
    opening: "下雨的时候，我把散落的照片重新放回有名字的文件夹。",
    detail:
      "第一步删除重复项，第二步补充拍摄日期，第三步给关键照片写 alt 文本，最后只挑几张加入文章。",
    takeaway: "整理是为了让未来的自己更容易重新遇见当时的生活。",
  },
  {
    slug: "math-in-the-reading-flow",
    title: "在页面里展示数学，而不打断阅读",
    summary:
      "行内公式适合解释符号，块级公式留给完整推导；两种方式都要有清楚的文字上下文。",
    tags: ["数学", "Writing", "教程"],
    status: "published",
    publishedDaysAgo: 64,
    views: 13,
    readTime: 5,
    opening: "公式不是文章里的异物，合适的说明可以让它变成下一句话。",
    detail:
      "短表达适合留在句子里面，较长的关系则单独占一行。之后再解释每个符号的含义，读者不必凭经验猜测。",
    takeaway: "先把问题说清楚，再让公式承担它最擅长的工作。",
  },
  {
    slug: "r2-object-key-names",
    title: "R2 对象路径的命名习惯",
    summary:
      "把主题资源、文章图片和本地演示素材分到清楚的前缀里，让查找和清理都有明确边界。",
    tags: ["R2", "Cloudflare", "数据库"],
    status: "published",
    publishedDaysAgo: 68,
    views: 12,
    readTime: 4,
    opening: "对象存储的路径不是文件系统，却同样需要让人读得懂。",
    detail:
      "站点横幅放在 asset/ 下，文章插图用 local-fixtures/ 前缀，文件名描述内容而不携带机器上的真实路径。",
    takeaway: "命名空间让本地测试素材可以被明确识别和清理。",
  },
  {
    slug: "social-links-with-restraint",
    title: "社交链接写得克制一点",
    summary:
      "首页只展示真正希望读者找到的入口，把联系信息和更新订阅放在最合适的位置。",
    tags: ["Design", "建站", "随笔"],
    status: "published",
    publishedDaysAgo: 72,
    views: 11,
    readTime: 3,
    opening: "链接越多，读者就越需要停下来判断下一步去哪。",
    detail:
      "这个虚构站点用本地的邮件地址和 RSS 路径作为示例。所有外部域名都使用保留的 .invalid 后缀。",
    takeaway: "少量明确的入口，通常比一排重复图标更友好。",
  },
  {
    slug: "tables-and-long-infographics",
    title: "把表格和长图放进同一篇教程里",
    summary:
      "当数据适合比较时用表格，当流程适合纵向阅读时用长图，并为图片补上能被读出来的说明。",
    tags: ["Accessibility", "数据可视化", "教程"],
    status: "published",
    publishedDaysAgo: 76,
    views: 10,
    readTime: 6,
    opening: "表格和长图都能讲清楚事情，只是它们擅长回答的问题不同。",
    detail:
      "横向比较用表格最直接，包含多个阶段的流程则适合长图。把关键信息也放进正文，读者就不必只靠图片理解。",
    takeaway: "选择内容能被读者顺利使用的形式，而不是只看哪一种更醒目。",
  },
  {
    slug: "one-paragraph-at-a-time",
    title: "Everyday Writing, One Paragraph at a Time",
    summary:
      "A low-pressure practice for turning a fleeting observation into a clear paragraph, with room for uncertainty and revision.",
    tags: ["Writing", "生活", "随笔"],
    status: "published",
    publishedDaysAgo: 82,
    views: 9,
    readTime: 3,
    opening:
      "A paragraph can be a complete practice even when it is not a complete essay.",
    detail:
      "I start with one concrete moment, name what surprised me, and write one sentence about what I still do not know. Revision can happen later.",
    takeaway: "Small finished pieces make it easier to return tomorrow. ",
  },
  {
    slug: "data-path-before-refactor",
    title: "下一次重构之前，先画出数据从表单到读者页面的来路",
    summary:
      "用一张简单的数据流图标明入口、数据库、缓存和呈现组件；动手改动之前，先确认每个边界都有人负责。",
    tags: ["Architecture", "TypeScript", "调试"],
    status: "published",
    publishedDaysAgo: 90,
    views: 8,
    readTime: 8,
    opening: "重构开始前，我会先找出读者看到的结果是怎样生成的。",
    detail:
      "表单校验、数据库写入、缓存失效和页面呈现分别属于不同边界。画出它们之间的数据流，就能识别重复职责和真正需要改变的部分。",
    takeaway: "先知道系统今天怎样工作，才知道明天该把哪一块做得更简单。",
  },
  {
    slug: "monday-morning-plan-draft",
    title: "周一早晨的计划（草稿）",
    summary: "还没有决定这一周要写什么，我先留下三个问题，等散步回来再回答。",
    tags: ["生活", "Writing", "草稿"],
    status: "draft",
    views: 0,
    readTime: 2,
    opening: "计划也可以从一个暂时没有答案的问题开始。",
    detail: "我想比较几种晨间习惯，但还需要更多真实记录。",
    takeaway: "草稿允许想法先保持松散。",
  },
  {
    slug: "image-caption-guide-draft",
    title: "The Unfinished Guide to Image Captions",
    summary:
      "A working outline about captions, alt text, and the difference between context and repetition.",
    tags: ["Accessibility", "摄影", "草稿"],
    status: "draft",
    views: 0,
    readTime: 4,
    opening: "This draft still needs examples from different kinds of images.",
    detail:
      "The current outline separates a visible caption from the alternative text used by assistive technology.",
    takeaway:
      "I will add examples after checking the rendering in the local theme.",
  },
  {
    slug: "widget-sketch-draft",
    title: "准备中的小组件实验",
    summary: "",
    tags: ["CSS", "实验", "草稿"],
    status: "draft",
    views: 0,
    readTime: 2,
    opening: "先记下当前观察，结论留给下一次。",
    detail: "小组件会试着把一周的阅读量画成一组轻柔色块。",
    takeaway: "这篇内容暂时只在管理界面可见。",
  },
  {
    slug: "future-notes-on-small-tools",
    title: "Small Tools, Long Memories — a Field Note for Next Month",
    summary:
      "An upcoming essay about the tiny tools that help memories stay searchable without turning every day into a data-entry task.",
    tags: ["Tools", "Writing", "排期"],
    status: "scheduled",
    futureDaysFromNow: 10,
    views: 0,
    readTime: 6,
    opening: "This scheduled note will be published after a final review. ",
    detail:
      "It compares a paper notebook, a browser bookmark, and a local search index through a single fictional week.",
    takeaway:
      "A useful archive should keep the memory and the person in the same story.",
  },
  {
    slug: "future-pocket-atlas",
    title: "Scheduled: A Pocket Atlas of Quiet Corners",
    summary:
      "A future photo essay mapping five calm places around an imaginary neighborhood, with local illustrations and short captions.",
    tags: ["摄影", "生活", "排期"],
    status: "scheduled",
    futureDaysFromNow: 24,
    views: 0,
    readTime: 5,
    opening: "The little atlas is scheduled for a later afternoon. ",
    detail:
      "Each stop has a color, a sound, and a small reason to pause before walking on.",
    takeaway: "The map is fictional; the invitation to notice is real.",
  },
];

const STRESS_ARCHIVE_TOPICS = [
  "a notebook passed between rooms",
  "small observations beside a train window",
  "an index for an imaginary reading group",
  "the quiet work of returning to a draft",
  "a made-up walk through a coastal town",
  "notes on keeping a local archive useful",
  "the order of ideas in a paper journal",
  "a fictional map of familiar corners",
  "short records from a patient workshop",
  "the shape of an afternoon without plans",
];

export const FIXTURE_STRESS_ARTICLES: FixtureArticle[] = Array.from(
  { length: 220 },
  (_, index) => {
    const sequence = index + 1;
    const ordinal = String(sequence).padStart(3, "0");
    const topic = STRESS_ARCHIVE_TOPICS[index % STRESS_ARCHIVE_TOPICS.length]!;
    const isLongFormSample = index === 0;

    return {
      slug: `local-archive-stress-${ordinal}`,
      title: isLongFormSample
        ? "Archive stress note 001: A Deliberately Long Fictional Reading Trail Across Years, Months, Cursor Pages, and Quiet Returns — 跨越年月与分页的本地虚构长标题"
        : `Fictional Archive Note ${ordinal}: ${topic} — 一段本地分页记录`,
      summary: isLongFormSample
        ? ""
        : `Synthetic local-only archive entry ${ordinal}: ${topic}. This invented note exists to exercise year and month indexes across cursor batches.`,
      tags: ["Writing", "Workflow", "搜索"],
      status: "published",
      // All stress entries predate the existing 90-day fixture window.
      publishedDaysAgo: 365 + sequence * 7,
      views: 0,
      readTime: 3 + (index % 7),
      ...(isLongFormSample ? { contentMode: "archive-stress" as const } : {}),
      opening: `This invented local record follows ${topic}; it contains no real person, event, or external image.`,
      detail: `Entry ${ordinal} is generated deterministically so repeated local fixture runs keep the same slug and archive shape. Its older publication date places it in the historical index.`,
      takeaway: `A useful local archive should keep ${topic} easy to find without changing the latest home-page entries.`,
    };
  },
);

export function getFixtureArticles(includeStress: boolean) {
  return includeStress
    ? [...FIXTURE_ARTICLES, ...FIXTURE_STRESS_ARTICLES]
    : FIXTURE_ARTICLES;
}

/** Known owned slugs used to remove stress rows even during a normal reseed. */
export const FIXTURE_CLEANUP_ARTICLES = [
  ...FIXTURE_ARTICLES,
  ...FIXTURE_STRESS_ARTICLES,
];

export const FIXTURE_FRIEND_LINKS = [
  {
    siteName: "Sample · Paper & Pine",
    siteUrl: "https://paper-and-pine.local.invalid",
    description: "A fictional journal about reading and small gardens.",
    logoKey: "local-fixtures/diagram.svg",
    contactEmail: "hello@paper-and-pine.local.invalid",
    status: "approved",
    userId: "local-fixture-reader-a",
  },
  {
    siteName: "Sample · Quiet Pixels",
    siteUrl: "https://quiet-pixels.local.invalid",
    description: "Tiny photographs and notes from an imaginary city.",
    logoKey: "local-fixtures/avatar.svg",
    contactEmail: "hi@quiet-pixels.local.invalid",
    status: "approved",
    userId: "local-fixture-reader-b",
  },
  {
    siteName: "Sample · Little Index",
    siteUrl: "https://little-index.local.invalid",
    description: "A made-up collection of useful links and book notes.",
    logoKey: "local-fixtures/diagram.svg",
    contactEmail: "notes@little-index.local.invalid",
    status: "approved",
    userId: "local-fixture-reader-c",
  },
  {
    siteName: "Sample · Pending Meadow",
    siteUrl: "https://pending-meadow.local.invalid",
    description: "A local-only pending friend link for moderation screens.",
    logoKey: "local-fixtures/avatar.svg",
    contactEmail: "owner@pending-meadow.local.invalid",
    status: "pending",
    userId: "local-fixture-reader-a",
  },
  {
    siteName: "Sample · Rejected Sketch",
    siteUrl: "https://rejected-sketch.local.invalid",
    description: "A local-only rejected friend link for status previews.",
    logoKey: "local-fixtures/diagram.svg",
    contactEmail: "owner@rejected-sketch.local.invalid",
    status: "rejected",
    userId: "local-fixture-reader-b",
  },
] as const;

export const FIXTURE_IMAGES = [
  {
    key: "asset/local-fixtures/home-banner.svg",
    fileName: "local-home-banner.svg",
    width: 1600,
    height: 900,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><defs><linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d6e9e6"/><stop offset="1" stop-color="#f4d9b8"/></linearGradient><linearGradient id="hill" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#789d8c"/><stop offset="1" stop-color="#355c58"/></linearGradient></defs><rect width="1600" height="900" fill="url(#sky)"/><circle cx="1240" cy="210" r="96" fill="#fff5d2" opacity=".85"/><path d="M0 620 300 380l210 180 260-310 290 310 190-170 350 300v210H0Z" fill="#adc7b4"/><path d="m0 735 330-220 270 185 290-200 360 250 240-170 310 200v120H0Z" fill="url(#hill)"/><path d="M0 790c220-54 320-40 510 0s330 30 520-14 365-41 570 9v115H0Z" fill="#e7c79c"/><g fill="#f8f4e9" opacity=".9"><rect x="180" y="640" width="120" height="132" rx="10"/><rect x="345" y="610" width="148" height="162" rx="12"/><rect x="1130" y="622" width="142" height="150" rx="10"/></g><g fill="#355c58"><path d="M235 598v-76l40-36 38 36v76Z"/><path d="M395 574v-85l47-42 48 42v85Z"/><path d="M1173 585v-76l50-46 51 46v76Z"/></g><text x="120" y="180" fill="#244a48" font-family="Georgia,serif" font-size="54">A small place to pause</text><text x="124" y="238" fill="#355c58" font-family="Arial,sans-serif" font-size="25">LOCAL FIXTURE LANDSCAPE · 1600 × 900</text></svg>`,
  },
  {
    key: "asset/local-fixtures/avatar.svg",
    fileName: "local-avatar.svg",
    width: 512,
    height: 512,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f2c7a8"/><stop offset="1" stop-color="#d48b75"/></linearGradient></defs><rect width="512" height="512" rx="256" fill="#d9ebe3"/><circle cx="256" cy="202" r="104" fill="url(#a)"/><path d="M73 512c17-117 89-178 183-178s166 61 183 178" fill="#456d65"/><path d="M155 180c6-83 54-125 108-125 66 0 111 51 106 131-30-26-66-37-106-37-38 0-75 12-108 31Z" fill="#354a45"/><circle cx="220" cy="207" r="8" fill="#293936"/><circle cx="292" cy="207" r="8" fill="#293936"/><path d="M226 252c18 15 42 15 60 0" fill="none" stroke="#8e5149" stroke-width="7" stroke-linecap="round"/><text x="256" y="465" text-anchor="middle" fill="#f7f3e9" font-family="Arial,sans-serif" font-size="23">LOCAL AUTHOR</text></svg>`,
  },
  {
    key: "local-fixtures/diagram.svg",
    fileName: "fixture-diagram.svg",
    width: 1200,
    height: 760,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760"><rect width="1200" height="760" rx="36" fill="#f4f0e7"/><text x="72" y="92" fill="#253d3a" font-family="Arial,sans-serif" font-size="35" font-weight="700">A small publishing loop</text><text x="74" y="136" fill="#61736a" font-family="Arial,sans-serif" font-size="20">fictional local fixture · no remote assets</text><g font-family="Arial,sans-serif" text-anchor="middle"><rect x="76" y="260" width="210" height="150" rx="24" fill="#e7c79c"/><text x="181" y="324" fill="#253d3a" font-size="25" font-weight="700">Write</text><text x="181" y="363" fill="#445b53" font-size="17">notes → draft</text><rect x="368" y="260" width="210" height="150" rx="24" fill="#b5d1c3"/><text x="473" y="324" fill="#253d3a" font-size="25" font-weight="700">Review</text><text x="473" y="363" fill="#445b53" font-size="17">content → preview</text><rect x="660" y="260" width="210" height="150" rx="24" fill="#c6d9e4"/><text x="765" y="324" fill="#253d3a" font-size="25" font-weight="700">Publish</text><text x="765" y="363" fill="#445b53" font-size="17">date → readers</text><rect x="952" y="260" width="172" height="150" rx="24" fill="#eac9bf"/><text x="1038" y="324" fill="#253d3a" font-size="25" font-weight="700">Learn</text><text x="1038" y="363" fill="#445b53" font-size="17">views → ideas</text></g><g fill="none" stroke="#61736a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><path d="M303 334h45m-12-14 14 14-14 14"/><path d="M595 334h45m-12-14 14 14-14 14"/><path d="M887 334h45m-12-14 14 14-14 14"/></g><path d="M1038 450c0 125-876 125-876 0" fill="none" stroke="#a0b8a9" stroke-width="5" stroke-dasharray="12 14"/><text x="600" y="570" text-anchor="middle" fill="#355c58" font-family="Georgia,serif" font-size="29">Small, reversible steps make a durable habit.</text><text x="600" y="625" text-anchor="middle" fill="#718078" font-family="Arial,sans-serif" font-size="18">The diagram is generated by scripts/local-dev/fixtures.ts</text></svg>`,
  },
  {
    key: "local-fixtures/long-infographic.svg",
    fileName: "fixture-long-infographic.svg",
    width: 1000,
    height: 2800,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2800" viewBox="0 0 1000 2800"><defs><linearGradient id="paper" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f5efe3"/><stop offset="1" stop-color="#e4eee7"/></linearGradient></defs><rect width="1000" height="2800" fill="url(#paper)"/><text x="90" y="150" fill="#284946" font-family="Georgia,serif" font-size="57">A Long, Quiet Workflow</text><text x="94" y="210" fill="#60786d" font-family="Arial,sans-serif" font-size="25">A generated vertical infographic for local image tests</text><path d="M180 350v2100" stroke="#789d8c" stroke-width="14" stroke-linecap="round"/><g font-family="Arial,sans-serif"><g><circle cx="180" cy="430" r="42" fill="#d48b75"/><rect x="270" y="340" width="600" height="210" rx="28" fill="#fffaf0"/><text x="320" y="408" fill="#284946" font-size="33" font-weight="700">01 · Capture</text><text x="320" y="463" fill="#51665e" font-size="23">Keep the first note short and local.</text></g><g><circle cx="180" cy="830" r="42" fill="#e7c79c"/><rect x="270" y="740" width="600" height="210" rx="28" fill="#fffaf0"/><text x="320" y="808" fill="#284946" font-size="33" font-weight="700">02 · Connect</text><text x="320" y="863" fill="#51665e" font-size="23">Add links only when they help recall.</text></g><g><circle cx="180" cy="1230" r="42" fill="#b5d1c3"/><rect x="270" y="1140" width="600" height="210" rx="28" fill="#fffaf0"/><text x="320" y="1208" fill="#284946" font-size="33" font-weight="700">03 · Shape</text><text x="320" y="1263" fill="#51665e" font-size="23">Give the draft a clear beginning.</text></g><g><circle cx="180" cy="1630" r="42" fill="#c6d9e4"/><rect x="270" y="1540" width="600" height="210" rx="28" fill="#fffaf0"/><text x="320" y="1608" fill="#284946" font-size="33" font-weight="700">04 · Review</text><text x="320" y="1663" fill="#51665e" font-size="23">Check links, images, and the reading path.</text></g><g><circle cx="180" cy="2030" r="42" fill="#eac9bf"/><rect x="270" y="1940" width="600" height="210" rx="28" fill="#fffaf0"/><text x="320" y="2008" fill="#284946" font-size="33" font-weight="700">05 · Publish</text><text x="320" y="2063" fill="#51665e" font-size="23">Choose a date that suits the story.</text></g><g><circle cx="180" cy="2430" r="42" fill="#789d8c"/><rect x="270" y="2340" width="600" height="210" rx="28" fill="#fffaf0"/><text x="320" y="2408" fill="#284946" font-size="33" font-weight="700">06 · Return</text><text x="320" y="2463" fill="#51665e" font-size="23">Let the next small note begin again.</text></g></g><text x="500" y="2670" text-anchor="middle" fill="#60786d" font-family="Georgia,serif" font-size="27">Made from SVG shapes and text · 1000 × 2800</text></svg>`,
  },
] as const;

export const FIXTURE_BANNER_URL =
  "/images/asset/local-fixtures/home-banner.svg?original=true";
export const FIXTURE_AVATAR_URL =
  "/images/asset/local-fixtures/avatar.svg?original=true";
export const FIXTURE_DIAGRAM_URL =
  "/images/local-fixtures/diagram.svg?original=true";
export const FIXTURE_LONG_IMAGE_URL =
  "/images/local-fixtures/long-infographic.svg?original=true";

export function buildArticleContent(article: FixtureArticle) {
  if (article.contentMode === "archive-stress") {
    const paragraph = (text: string) => ({
      type: "paragraph",
      content: [{ type: "text", text }],
    });
    const heading = (level: 1 | 2 | 3, text: string) => ({
      type: "heading",
      attrs: { level },
      content: [{ type: "text", text }],
    });
    const cell = (text: string, type = "tableCell") => ({
      type,
      content: [paragraph(text)],
    });
    const code = Array.from({ length: 64 }, (_, index) => {
      const line = String(index + 1).padStart(2, "0");
      return `const checkpoint${line} = { batch: ${index + 1}, label: "fictional local row ${line}" };`;
    }).join("\n");
    const headers = [
      "Year",
      "Month",
      "Cursor batch",
      "Batch offset",
      "Status",
      "Fictional slug",
      "Views",
      "Origin",
    ];
    const tableRows = Array.from({ length: 8 }, (_, index) => {
      const row = index + 1;
      return [
        String(2025 - index),
        String(((row + 2) % 12) + 1).padStart(2, "0"),
        `page-${row}`,
        String(((row - 1) % 50) + 1),
        "published",
        `local-archive-stress-${String(row).padStart(3, "0")}`,
        String((row * 7) % 93),
        "local-only",
      ];
    });

    return {
      type: "doc",
      content: [
        heading(1, article.title),
        paragraph(article.opening),
        heading(2, "Cursor boundaries / 分页边界"),
        paragraph(article.detail),
        heading(3, "A stable record / 可重复记录"),
        paragraph(article.takeaway),
        {
          type: "codeBlock",
          attrs: { language: "ts" },
          content: [{ type: "text", text: code }],
        },
        {
          type: "table",
          content: [
            {
              type: "tableRow",
              content: headers.map((value) => cell(value, "tableHeader")),
            },
            ...tableRows.map((row) => ({
              type: "tableRow",
              content: row.map((value) => cell(value)),
            })),
          ],
        },
        paragraph(
          "Every value in this large sample is invented for a local-only archive preview.",
        ),
      ],
    };
  }

  const code = [
    `const topic = ${JSON.stringify(article.tags[0] ?? "notes")};`,
    "const readingMinutes = Math.ceil(wordCount / 220);",
    "return { topic, readingMinutes };",
  ].join("\n");

  const para = (text: string) => ({
    type: "paragraph",
    content: [{ type: "text", text }],
  });
  const cell = (text: string, type = "tableCell") => ({
    type,
    content: [para(text)],
  });

  return {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: article.title }],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: article.opening },
          { type: "text", text: " The small detail is " },
          { type: "text", text: "worth keeping", marks: [{ type: "bold" }] },
          { type: "text", text: ", even when the rest is still " },
          { type: "text", text: "unfinished", marks: [{ type: "italic" }] },
          { type: "text", text: ". See the " },
          {
            type: "text",
            text: "local field note",
            marks: [
              {
                type: "link",
                attrs: {
                  href: "https://notes.local.invalid/field-note",
                  target: "_blank",
                  rel: "noopener noreferrer",
                },
              },
            ],
          },
          { type: "text", text: " for another fictional example." },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "观察与背景 / Context" }],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: article.detail },
          { type: "text", text: " One useful command is " },
          {
            type: "text",
            text: "bun run local:seed",
            marks: [{ type: "code" }],
          },
          { type: "text", text: "; here it appears only as sample text." },
        ],
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "先把问题说清楚" }],
      },
      para(article.takeaway),
      {
        type: "blockquote",
        content: [
          para(
            "“A useful note leaves enough context for the next reader, including the future version of yourself.”",
          ),
        ],
      },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [
              para("先记录眼前观察，不急着归类。 / Capture the observation."),
            ],
          },
          {
            type: "listItem",
            content: [
              para("给概念一个具体例子。 / Keep one concrete example."),
            ],
          },
          {
            type: "listItem",
            content: [
              para("留下可以继续追问的地方。 / Leave a question open."),
            ],
          },
        ],
      },
      {
        type: "orderedList",
        attrs: { start: 1, type: "1" },
        content: [
          {
            type: "listItem",
            content: [para("收集一条输入。 / Collect one input.")],
          },
          {
            type: "listItem",
            content: [para("检查内容和日期。 / Review content and date.")],
          },
          {
            type: "listItem",
            content: [
              para("把结果连回主题。 / Connect the result to a topic."),
            ],
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "小实验 / A tiny experiment" }],
      },
      para(
        "下面的片段是可读的 TypeScript 示例，说明值怎样经过一次小小的整理。",
      ),
      {
        type: "codeBlock",
        attrs: { language: "ts" },
        content: [{ type: "text", text: code }],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "The average can be written inline as " },
          {
            type: "inlineMath",
            attrs: { latex: "\\bar{x}=\\frac{1}{n}\\sum_{i=1}^{n}x_i" },
          },
          {
            type: "text",
            text: ", while the full relation gets its own line.",
          },
        ],
      },
      {
        type: "blockMath",
        attrs: {
          latex:
            "\\text{signal} = \\frac{\\text{useful notes}}{\\text{time to find them}}",
        },
      },
      {
        type: "table",
        content: [
          {
            type: "tableRow",
            content: [
              cell("阶段 / Stage", "tableHeader"),
              cell("动作 / Action", "tableHeader"),
              cell("检查 / Check", "tableHeader"),
            ],
          },
          {
            type: "tableRow",
            content: [cell("Capture"), cell("留一条线索"), cell("是否本地")],
          },
          {
            type: "tableRow",
            content: [cell("Review"), cell("对照正文"), cell("是否清楚")],
          },
          {
            type: "tableRow",
            content: [cell("Return"), cell("补上上下文"), cell("是否可复现")],
          },
        ],
      },
      {
        type: "image",
        attrs: {
          src: FIXTURE_DIAGRAM_URL,
          alt: "写作、检查、发布和回看的本地流程图",
          title: "本地生成的 SVG 流程图",
          width: 1200,
          height: 760,
          caption: "本地生成的 SVG 流程图：从草稿到回看",
          align: "center",
        },
      },
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "把流程拉长来看" }],
      },
      para(
        "长图用于测试纵向阅读、图片说明和原图请求。它完全由本地 SVG 图形构成，不加载远程图片。",
      ),
      {
        type: "image",
        attrs: {
          src: FIXTURE_LONG_IMAGE_URL,
          alt: "从记录到回看的六步纵向信息图，尺寸为 1000 × 2800",
          title: "纵向工作流信息图",
          width: 1000,
          height: 2800,
          caption: "六步纵向信息图：记录、连接、整理、检查、发布、回看",
          align: "center",
        },
      },
      para(
        "Every example in this article is invented for a local-only preview. The important result is that headings, emphasis, links, lists, code, formulas, tables, and image captions all share one readable document.",
      ),
    ],
  };
}
