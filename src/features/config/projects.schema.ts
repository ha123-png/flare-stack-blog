import { z } from "zod";

const httpUrl = z
  .string()
  .trim()
  .refine((value) => {
    if (!value) return true;
    try {
      return ["https:", "http:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "请输入完整的 http(s) 地址");
const imageRef = z
  .string()
  .trim()
  .refine(
    (value) =>
      !value || /^\/(?!\/)/.test(value) || httpUrl.safeParse(value).success,
    "请输入图片路径或 http(s) 地址",
  );
export const ProjectSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, "请填写项目标识")
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "使用小写字母、数字和短横线"),
  title: z.string().trim().min(1, "请填写项目名称").max(80),
  category: z.string().trim().max(80),
  description: z.string().trim().max(1000),
  year: z.string().trim().max(30),
  status: z.string().trim().max(40),
  url: httpUrl,
  image: imageRef,
  accent: z.enum([
    "cobalt",
    "lacquer",
    "emerald",
    "petroleum",
    "violet",
    "copper",
  ]),
  tagNames: z.array(z.string().trim().min(1).max(120)).max(20),
  leadSlug: z.string().trim().max(250),
  video: z
    .object({ src: httpUrl, title: z.string(), poster: imageRef.optional() })
    .optional(),
});
export const ProjectsSchema = z
  .array(ProjectSchema)
  .max(30)
  .refine(
    (items) => new Set(items.map((item) => item.id)).size === items.length,
    "项目标识不能重复",
  );
export const WelcomeSchema = z.object({
  title: z.string().trim().max(120),
  description: z.string().trim().max(300),
});
export type Project = z.infer<typeof ProjectSchema>;
export type Chroma = Project["accent"];

export const ZHEYE_WELCOME = {
  title: "写下思考，也让想法成形。",
  description: "记录技术、生活与创作，留下作品逐渐成形的过程。",
};
/** Initial content only. Once saved, all displays use the site's editable records. */
export const ZHEYE_PROJECTS: Project[] = [
  {
    id: "zhiyi",
    title: "知意",
    category: "本地智能数据工作台",
    description:
      "从文件，到你关心的事。把图片、PDF 和表格里的信息，整理成可核对、可追溯、可继续使用的数据。原件留下，信息成序。",
    year: "2026",
    status: "持续迭代",
    url: "https://zhiyi.szweb.ren/",
    image: "/themes/szweb/zhiyi.webp",
    accent: "cobalt",
    tagNames: ["知意"],
    leadSlug: "从一份文档到一条可追溯的数据-1",
  },
  {
    id: "seasons",
    title: "四时 · 借一刻",
    category: "时间与交互实验",
    description:
      "四幅猫猫原画，一段仍在发生的时间。让时钟、光影与声音一起缓慢流动，也可以寄出一刻，把此时的心情留给另一个人。",
    year: "2026",
    status: "可以体验",
    url: "https://seasons.szweb.ren/?season=spring",
    image: "/themes/szweb/seasons-spring.webp",
    accent: "emerald",
    tagNames: ["四时"],
    leadSlug: "",
  },
  {
    id: "yingtian",
    title: "英田数控",
    category: "工业品牌与产品展示",
    description:
      "精密有形，制造有力。从机型展厅到加工过程，把机器、技术与制造现场组织成一段可以理解、可以探索的品牌叙事。",
    year: "2026",
    status: "已上线",
    url: "https://yingtian.szweb.ren/",
    image: "/themes/szweb/yingtian.webp",
    accent: "copper",
    tagNames: ["英田数控"],
    leadSlug: "",
  },
];

export function projectMatchesPost(
  project: Project,
  post: { slug: string; tags?: Array<{ name: string }> },
) {
  return (
    (!!project.leadSlug && project.leadSlug === post.slug) ||
    !!post.tags?.some((tag) => project.tagNames.includes(tag.name))
  );
}
