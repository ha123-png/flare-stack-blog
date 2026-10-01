import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { postsInfiniteQueryOptions } from "@/features/posts/queries";
import { buildArchiveGroups } from "./archive-index";

/** The directory and archive share the existing published-post cursor cache. */
export function useArchiveIndex() {
  const query = useSuspenseInfiniteQuery(
    postsInfiniteQueryOptions({ limit: 50 }),
  );
  const loadedPosts = useMemo(
    () => query.data.pages.flatMap((page) => page.items),
    [query.data.pages],
  );
  const groups = useMemo(() => buildArchiveGroups(loadedPosts), [loadedPosts]);
  useEffect(() => {
    if (
      query.hasNextPage &&
      !query.isFetchingNextPage &&
      !query.isFetchNextPageError
    ) {
      void query.fetchNextPage({ cancelRefetch: false });
    }
  }, [
    query.hasNextPage,
    query.isFetchingNextPage,
    query.isFetchNextPageError,
    query.fetchNextPage,
  ]);
  return {
    ...query,
    loadedPosts,
    groups,
    count: groups.reduce((total, group) => total + group.count, 0),
  };
}
