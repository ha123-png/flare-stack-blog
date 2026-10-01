import type { Chroma } from "../site";

export const articleAccents: readonly Chroma[] = [
  "cobalt",
  "lacquer",
  "emerald",
  "petroleum",
  "violet",
  "copper",
];

/** A page keeps its reverse color across lists, search, and reading.
 * Explicit editorial tags win; otherwise the canonical slug selects one ink.
 * No randomness, tag-order dependence, browser storage, or CMS mutation.
 */
export function articleChroma(
  slug: string,
  tags: readonly (string | { name: string })[] = [],
): Chroma | undefined {
  for (const tag of tags) {
    const name = (typeof tag === "string" ? tag : tag.name)
      .trim()
      .toLowerCase();
    if (!name.startsWith("_chroma:")) continue;
    const value = name.slice(8).trim();
    const accent = articleAccents.find((item) => item === value);
    if (accent) return accent;
  }
  const identity = slug.trim().normalize("NFC");
  if (!identity) return undefined;
  let hash = 2166136261;
  for (let i = 0; i < identity.length; i++) {
    hash = Math.imul(hash ^ identity.charCodeAt(i), 16777619) >>> 0;
  }
  return articleAccents[hash % articleAccents.length];
}
