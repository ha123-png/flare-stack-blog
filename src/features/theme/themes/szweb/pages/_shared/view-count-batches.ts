const MAX_SLUGS = 50;
const MAX_KEY_BYTES = 512;
const PREFIX_BYTES = new TextEncoder().encode("pageview:counts").length;

/** Respect both the public API count limit and the existing KV cache key limit. */
export function viewCountBatches(slugs: string[]): string[][] {
  const encoder = new TextEncoder();
  const batches: string[][] = [];
  let batch: string[] = [];
  let bytes = PREFIX_BYTES;
  for (const slug of new Set(slugs.filter(Boolean))) {
    const size = 1 + encoder.encode(slug).length;
    if (
      batch.length &&
      (batch.length >= MAX_SLUGS || bytes + size > MAX_KEY_BYTES)
    ) {
      batches.push(batch);
      batch = [];
      bytes = PREFIX_BYTES;
    }
    // A single oversized legacy slug still gets its count through the existing
    // service's uncached fallback; never silently omit a post's statistics.
    batch.push(slug);
    bytes += size;
  }
  if (batch.length) batches.push(batch);
  return batches;
}
