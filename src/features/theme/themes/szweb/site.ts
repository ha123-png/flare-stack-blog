import { zheyeIdentity } from "./identity";

export type Chroma =
  | "cobalt"
  | "lacquer"
  | "emerald"
  | "petroleum"
  | "violet"
  | "copper";

export interface Project {
  id: string;
  title: string;
  description: string;
  year: string;
  url?: string;
  image?: string;
  accent?: Chroma;
  status: string;
  category: string;
  /** Optional insert material; published articles still come from the CMS. */
  relatedSlugs?: string[];
  video?: { src: string; title: string; poster?: string };
}

// Replace the concept examples here. Components have no project-specific logic.
export const szwebSite = {
  wordmark: zheyeIdentity.name,
  domain: zheyeIdentity.domain,
  introduction: "写下想法，也把它做出来。",
  now: [] as string[],
  projects: [
    {
      id: "atlas",
      title: "Atlas",
      category: "文档工作台",
      description:
        "从分散的原始文档，到可以核对、修正与使用的结构化数据。为每一个结果，保留一条回到来源的路。",
      year: "2026",
      image: "/themes/szweb/atlas.svg",
      accent: "cobalt",
      status: "概念研究",
    },
    {
      id: "field",
      title: "Field",
      category: "交互实验",
      description:
        "研究图像、动作和注意力的关系。在明确的边界之内，让一次细微的变化传递足够的信息。",
      year: "2025—2026",
      image: "/themes/szweb/field.svg",
      accent: "emerald",
      status: "开放实验",
    },
    {
      id: "forma",
      title: "Forma",
      category: "工业界面研究",
      description:
        "从工业对象中提取方向、比例与层级。把信息组织得更清楚，也更有力量。",
      year: "2025",
      image: "/themes/szweb/forma.svg",
      accent: "copper",
      status: "概念研究",
    },
  ] satisfies Project[],
};

export interface EditorialMedia {
  image: string;
  alt: string;
  accent?: Chroma;
}
// An explicit editorial mapping; ordinary articles have no synthetic accent/cover.
export const editorialMedia: Record<string, EditorialMedia> = {};

export const isPublicTag = (name: string) =>
  !name.trim().toLowerCase().startsWith("_chroma:");
