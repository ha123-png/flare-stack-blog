import { createFileRoute, notFound } from "@tanstack/react-router";
import theme from "@theme";
import { siteConfigQuery, siteDomainQuery } from "@/features/config/queries";
import { tagsQueryOptions } from "@/features/tags/queries";
import type { ThemeComponents } from "@/features/theme/contract/components";
import { buildCanonicalUrl, canonicalLink } from "@/lib/seo";
import { getLocale } from "@/paraglide/runtime";

const Page = (theme as ThemeComponents).TagsPage;
export const Route = createFileRoute("/_public/tags")({
  beforeLoad: () => {
    if (!Page) throw notFound();
  },
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(tagsQueryOptions);
    const [domain, site] = await Promise.all([
      context.queryClient.ensureQueryData(siteDomainQuery),
      context.queryClient.ensureQueryData(siteConfigQuery),
    ]);
    return {
      title:
        (getLocale() === "en" ? "Topics" : "主题索引") + " · " + site.title,
      description: site.description,
      canonicalHref: buildCanonicalUrl(domain, "/tags"),
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title },
      { name: "description", content: loaderData?.description },
    ],
    links: [canonicalLink(loaderData?.canonicalHref ?? "/")],
  }),
  component: PageRoute,
});
function PageRoute() {
  return Page ? <Page /> : null;
}
