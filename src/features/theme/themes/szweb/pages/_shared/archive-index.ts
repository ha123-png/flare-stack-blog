export interface DatedPost {
  publishedAt: Date | string | null;
}

export interface ArchiveMonthGroup<TPost extends DatedPost> {
  year: number;
  month: number;
  posts: Array<TPost>;
}

export interface ArchiveYearGroup<TPost extends DatedPost> {
  year: number;
  count: number;
  months: Array<ArchiveMonthGroup<TPost>>;
}

export function archiveDateParts(post: DatedPost) {
  if (!post.publishedAt) return null;
  const date =
    post.publishedAt instanceof Date
      ? post.publishedAt
      : new Date(post.publishedAt);
  if (Number.isNaN(date.getTime())) return null;
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

/** Group all cursor batches by UTC year/month without losing each post's order. */
export function buildArchiveGroups<TPost extends DatedPost>(
  posts: Array<TPost>,
): Array<ArchiveYearGroup<TPost>> {
  const years = new Map<number, Map<number, Array<TPost>>>();

  for (const post of posts) {
    const parts = archiveDateParts(post);
    if (!parts) continue;
    const months = years.get(parts.year) ?? new Map<number, Array<TPost>>();
    const monthPosts = months.get(parts.month) ?? [];
    monthPosts.push(post);
    months.set(parts.month, monthPosts);
    years.set(parts.year, months);
  }

  return [...years.entries()]
    .sort(([yearA], [yearB]) => yearB - yearA)
    .map(([year, months]) => {
      const monthGroups = [...months.entries()]
        .sort(([monthA], [monthB]) => monthB - monthA)
        .map(([month, monthPosts]) => ({ year, month, posts: monthPosts }));

      return {
        year,
        count: monthGroups.reduce(
          (total, month) => total + month.posts.length,
          0,
        ),
        months: monthGroups,
      };
    });
}
