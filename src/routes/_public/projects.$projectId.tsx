import { createFileRoute, notFound } from "@tanstack/react-router";
import theme from "@theme";
import { siteConfigQuery, siteDomainQuery } from "@/features/config/queries";
import { postBySlugQuery } from "@/features/posts/queries";
import type { ThemeComponents } from "@/features/theme/contract/components";
import { type Project, szwebSite } from "@/features/theme/themes/szweb/site";
import { buildCanonicalUrl, canonicalLink } from "@/lib/seo";

const Page = (theme as ThemeComponents).ProjectPage;
export const Route = createFileRoute("/_public/projects/$projectId")({
  beforeLoad: () => {
    if (!Page) throw notFound();
  },
  loader: async ({ context, params }) => {
    const project = (szwebSite.projects as Project[]).find(
      (item) => item.id === params.projectId,
    );
    if (!project) throw notFound();

    await Promise.all(
      (project.relatedSlugs ?? []).map((slug) =>
        context.queryClient.prefetchQuery(postBySlugQuery(slug)),
      ),
    );

    const [domain, site] = await Promise.all([
      context.queryClient.ensureQueryData(siteDomainQuery),
      context.queryClient.ensureQueryData(siteConfigQuery),
    ]);
    return {
      title: project.title + " · " + site.title,
      description: project.description,
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
    ],
    links: [canonicalLink(loaderData?.canonicalHref ?? "/")],
  }),
  component: PageRoute,
});
function PageRoute() {
  const { projectId } = Route.useParams();
  return Page ? <Page projectId={projectId} /> : null;
}
