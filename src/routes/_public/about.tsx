import { createFileRoute, notFound } from "@tanstack/react-router";
import theme from "@theme";
import { siteConfigQuery, siteDomainQuery } from "@/features/config/queries";
import type { ThemeComponents } from "@/features/theme/contract/components";
import { buildCanonicalUrl, canonicalLink } from "@/lib/seo";
import { getLocale } from "@/paraglide/runtime";

const Page = (theme as ThemeComponents).AboutPage;
export const Route = createFileRoute("/_public/about")({
  beforeLoad: () => {
    if (!Page) throw notFound();
  },
  loader: async ({ context }) => {
    const [domain, site] = await Promise.all([
      context.queryClient.ensureQueryData(siteDomainQuery),
      context.queryClient.ensureQueryData(siteConfigQuery),
    ]);
    return {
      title: (getLocale() === "en" ? "About" : "关于") + " · " + site.title,
      description: site.description,
      canonicalHref: buildCanonicalUrl(domain, "/about"),
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
