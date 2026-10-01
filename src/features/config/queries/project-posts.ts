import { infiniteQueryOptions } from "@tanstack/react-query";
import type { Project } from "../projects.schema";
import { getProjectPostsFn } from "../api/project-posts.api";

export const projectPostsQuery = (project: Project) =>
  infiniteQueryOptions({
    queryKey: [
      "posts",
      "project",
      project.id,
      project.tagNames,
      project.leadSlug,
    ],
    queryFn: ({ pageParam }) =>
      getProjectPostsFn({
        data: { projectId: project.id, cursor: pageParam, limit: 12 },
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
