/** The site's identity, kept separate from the domain and author identity. */
export const zheyeIdentity = {
  name: "折页",
  domain: "szweb.ren",
  description: "写作、项目与过程。",
} as const;

/** Upgrade only this site's legacy placeholder name, never a custom CMS title. */
export function zheyePublicTitle(title: string): string {
  return /^(szweb(?:\.ren)?|名称|站点名称)?$/i.test(title.trim())
    ? zheyeIdentity.name
    : title;
}
