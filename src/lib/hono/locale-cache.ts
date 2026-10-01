/** Separate rendered languages without varying public APIs or static assets. */
export function localeCacheRequest(request: Request, locale: string) {
  const url = new URL(request.url);
  if (
    /^\/(api|_serverFn|assets|images|themes)(\/|$)/.test(url.pathname) ||
    /\.[a-z0-9]+$/i.test(url.pathname)
  )
    return request;
  url.searchParams.set("__page_locale", locale);
  return new Request(url, request);
}
