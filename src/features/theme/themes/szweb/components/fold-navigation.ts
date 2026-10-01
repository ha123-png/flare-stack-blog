export const foldChapters = [
  { to: "/", title: "首页", en: "Home" },
  { to: "/posts", title: "文章", en: "Articles" },
  { to: "/projects", title: "项目", en: "Projects" },
  { to: "/archive", title: "时间", en: "Time" },
  { to: "/directory", title: "索引", en: "Index" },
  { to: "/about", title: "关于", en: "About" },
] as const;

/** Detail pages and secondary indexes belong to their parent chapter. */
export function foldChapter(pathname: string) {
  if (/^\/post(?:\/|$)/.test(pathname)) return "/posts";
  if (/^\/(tags|search|friend-links)(?:\/|$)/.test(pathname))
    return "/directory";
  return foldChapters.find(({ to }) =>
    to === "/"
      ? pathname === "/"
      : pathname === to || pathname.startsWith(to + "/"),
  )?.to;
}
