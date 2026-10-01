import { createFileRoute, notFound } from "@tanstack/react-router";
import theme from "@theme";
import { siteConfigQuery, siteDomainQuery } from "@/features/config/queries";
import { postsInfiniteQueryOptions } from "@/features/posts/queries";
import { tagsQueryOptions } from "@/features/tags/queries";
import type { ThemeComponents } from "@/features/theme/contract/components";
import { buildCanonicalUrl, canonicalLink } from "@/lib/seo";
import { getLocale } from "@/paraglide/runtime";

const Page = (theme as ThemeComponents).DirectoryPage;
export const Route = createFileRoute("/_public/directory")({
  beforeLoad: () => {
    if (!Page) throw notFound();
  },
  loader: async ({ context }) => {
    const [domain, site] = await Promise.all([
      context.queryClient.ensureQueryData(siteDomainQuery),
      context.queryClient.ensureQueryData(siteConfigQuery),
      context.queryClient.prefetchQuery(tagsQueryOptions),
      context.queryClient.prefetchInfiniteQuery(
        postsInfiniteQueryOptions({ limit: 50 }),
      ),
    ]);
    return {
      title: (getLocale() === "en" ? "Index" : "索引") + " · " + site.title,
      description:
        getLocale() === "en"
          ? "Writing, projects, time and connections."
          : "折页的文章、项目、时间与连接。",
      canonicalHref: buildCanonicalUrl(domain, "/directory"),
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title },
      { name: "description", content: loaderData?.description },
    ],
    links: [canonicalLink(loaderData?.canonicalHref ?? "/")],
  }),
  component: () => (Page ? <Page /> : null),
});
