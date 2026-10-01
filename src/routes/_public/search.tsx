import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import theme from "@theme";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  searchDocsQueryOptions,
  searchMetaQuery,
} from "@/features/search/queries";
import { useDebounce } from "@/hooks/use-debounce";
import { useNavigateBack } from "@/hooks/use-navigate-back";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

const searchSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute("/_public/search")({
  validateSearch: (search) => searchSchema.parse(search),
  component: SearchRoute,
  loader: () => {
    return {
      title: m.search_title(),
    };
  },
  head: ({ loaderData }) => {
    return {
      meta: [
        {
          title: loaderData?.title,
        },
      ],
    };
  },
});

function SearchRoute() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const handleBack = useNavigateBack({ fallbackTo: "/" });

  const [query, setQuery] = useState(search.q || "");

  useEffect(() => {
    if (search.q !== undefined && search.q !== query) {
      setQuery(search.q);
    }
  }, [search.q]);

  const debouncedQuery = useDebounce(query.trim(), 300);

  useEffect(() => {
    if (debouncedQuery !== (search.q || "")) {
      navigate({
        search: (prev) => ({
          ...prev,
          q: debouncedQuery || undefined,
        }),
        replace: true,
      });
    }
  }, [debouncedQuery, navigate, search.q]);

  const metaQuery = useQuery({
    ...searchMetaQuery,
    staleTime: 5 * 60 * 1000,
  });

  const resultQuery = useQuery({
    ...searchDocsQueryOptions(
      debouncedQuery,
      metaQuery.data?.version || "init",
    ),
    enabled: debouncedQuery.length > 0 && !!metaQuery.data?.version,
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  });

  const searchResults = useMemo(
    () => resultQuery.data ?? [],
    [resultQuery.data],
  );
  const isSearching =
    query.trim().length > 0 &&
    (query.trim() !== debouncedQuery ||
      metaQuery.isPending ||
      resultQuery.isFetching);

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
  };

  const handleSelectPost = (slug: string) => {
    navigate({ to: "/post/$slug", params: { slug } });
  };

  return (
    <theme.SearchPage
      query={query}
      results={searchResults}
      isSearching={isSearching}
      errorMessage={
        metaQuery.isError || resultQuery.isError
          ? getLocale() === "en"
            ? "Search is unavailable. Please try again."
            : "搜索暂时无法连接，请重试。"
          : undefined
      }
      onRetry={() => {
        void metaQuery.refetch();
        if (metaQuery.data?.version) void resultQuery.refetch();
      }}
      onQueryChange={handleQueryChange}
      onSelectPost={handleSelectPost}
      onBack={handleBack}
    />
  );
}
