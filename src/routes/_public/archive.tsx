import { createFileRoute, notFound } from "@tanstack/react-router";
import theme from "@theme";
import { siteConfigQuery, siteDomainQuery } from "@/features/config/queries";
import { postsInfiniteQueryOptions } from "@/features/posts/queries";
import type { ThemeComponents } from "@/features/theme/contract/components";
import { buildCanonicalUrl, canonicalLink } from "@/lib/seo";
import { getLocale } from "@/paraglide/runtime";

const Page = (theme as ThemeComponents).ArchivePage;
export const Route = createFileRoute("/_public/archive")({
  beforeLoad: () => {
    if (!Page) throw notFound();
  },
  loader: async ({ context }) => {
    await context.queryClient.prefetchInfiniteQuery(
      postsInfiniteQueryOptions({ limit: 50 }),
    );
    const [domain, site] = await Promise.all([
      context.queryClient.ensureQueryData(siteDomainQuery),
      context.queryClient.ensureQueryData(siteConfigQuery),
    ]);
    return {
      title:
        (getLocale() === "en" ? "Time" : "时间") + " · " + site.title,
      description: site.description,
      canonicalHref: buildCanonicalUrl(domain, "/archive"),
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
