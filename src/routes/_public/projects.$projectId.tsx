import { createFileRoute, notFound } from "@tanstack/react-router";
import theme from "@theme";
import { siteConfigQuery, siteDomainQuery } from "@/features/config/queries";
import { projectPostsQuery } from "@/features/config/queries/project-posts";
import type { ThemeComponents } from "@/features/theme/contract/components";
import { buildCanonicalUrl, canonicalLink } from "@/lib/seo";

const Page = (theme as ThemeComponents).ProjectPage;
export const Route = createFileRoute("/_public/projects/$projectId")({
  beforeLoad: () => {
    if (!Page) throw notFound();
  },
  loader: async ({ context, params }) => {
    const [domain, site] = await Promise.all([
      context.queryClient.ensureQueryData(siteDomainQuery),
      context.queryClient.ensureQueryData(siteConfigQuery),
    ]);
    const project = (site.projects ?? []).find(
      (item) => item.id === params.projectId,
    );
    if (!project) throw notFound();

    await context.queryClient.prefetchInfiniteQuery(projectPostsQuery(project));
    return {
      title: project.title + " · " + site.title,
      description: project.description,
      image: project.image
        ? new URL(project.image, `https://${domain}`).href
        : undefined,
      siteName: site.title,
      canonicalHref: buildCanonicalUrl(
        domain,
        "/projects/" + encodeURIComponent(params.projectId),
      ),
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title },
      { name: "description", content: loaderData?.description },
      { property: "og:title", content: loaderData?.title },
      { property: "og:description", content: loaderData?.description },
      { property: "og:site_name", content: loaderData?.siteName },
      { property: "og:type", content: "website" },
      { property: "og:url", content: loaderData?.canonicalHref },
      ...(loaderData?.image
        ? [{ property: "og:image", content: loaderData.image }]
        : []),
    ],
    links: [canonicalLink(loaderData?.canonicalHref ?? "/")],
  }),
  component: PageRoute,
});
function PageRoute() {
  const { projectId } = Route.useParams();
  return Page ? <Page projectId={projectId} /> : null;
}
