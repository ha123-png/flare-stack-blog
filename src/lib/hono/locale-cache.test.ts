import { describe, expect, it } from "vitest";
import { localeCacheRequest } from "./locale-cache";

describe("rendered page cache", () => {
  it("keeps the same URL's Chinese and English responses separate", () => {
    const request = new Request("https://szweb.ren/directory?q=example");
    const cache = new Map([
      [localeCacheRequest(request, "zh").url, "中文目录"],
      [localeCacheRequest(request, "en").url, "English contents"],
    ]);
    expect(cache.get(localeCacheRequest(request, "zh").url)).toBe("中文目录");
    expect(cache.get(localeCacheRequest(request, "en").url)).toBe(
      "English contents",
    );
    expect(request.url).toBe("https://szweb.ren/directory?q=example");
  });
  it("normalizes a supplied variant and leaves public resources alone", () => {
    const request = new Request("https://szweb.ren/?__page_locale=en");
    expect(
      new URL(localeCacheRequest(request, "zh").url).searchParams.get(
        "__page_locale",
      ),
    ).toBe("zh");
    for (const path of [
      "/api/posts?limit=12",
      "/_serverFn/config?data=test",
      "/rss.xml",
      "/themes/szweb/zhiyi.webp",
      "/images/test",
    ]) {
      const resource = new Request("https://szweb.ren" + path);
      expect(localeCacheRequest(resource, "en")).toBe(resource);
    }
  });
});
