import type { ThemeConfig } from "@/features/theme/contract/config";

export const config: ThemeConfig = {
  home: { recentPostsLimit: 6, popularPostsLimit: 3 },
  posts: { postsPerPage: 12 },
  post: { relatedPostsLimit: 3 },
};
