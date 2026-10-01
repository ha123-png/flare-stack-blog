import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { getViewCountsFn } from "@/features/pageview/api/pageview.api";
import { PAGEVIEW_KEYS } from "@/features/pageview/queries";
import { viewCountBatches } from "./view-count-batches";

const VIEW_COUNT_STALE_TIME = 5 * 60 * 1000;

/** Keep requests within the API count limit and KV's UTF-8 key budget. */
export function useBatchedViewCounts(slugs: Array<string>) {
  const chunks = useMemo(() => viewCountBatches(slugs), [slugs]);

  const queries = useQueries({
    queries: chunks.map((batch) => ({
      queryKey: PAGEVIEW_KEYS.viewCounts(batch),
      queryFn: () => getViewCountsFn({ data: { slugs: batch } }),
      enabled: batch.length > 0,
      staleTime: VIEW_COUNT_STALE_TIME,
    })),
  });

  const counts = useMemo(
    () => Object.assign({}, ...queries.map((query) => query.data ?? {})),
    [queries],
  );

  return {
    counts,
    isPending: queries.some((query) => query.isPending),
    isError: queries.some((query) => query.isError),
  };
}
