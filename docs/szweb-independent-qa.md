# szweb Theme · Independent Design and Regression QA

**QA date:** 2026-09-30\
**Workspace branch:** `feat/szweb-theme`\
**Independent verdict:** **DESIGN YES · CAPABILITY REGRESSION PASS · LOCAL ENGINEERING PASS · PRODUCTION SAFETY PASS**

If I saw the final site without knowing it came from an existing CMS, I would recognize it as a complete, mature personal blog. The screenshots retain the approved art direction, and the tested public, account, and comment flows continue to use the existing application services.

## Design QA

I compared the final images with `.local-dev/concept-review/` and personally inspected the required final views: desktop Home, Articles, Post, Search, and Archive at 1440; Home, Articles, Post, Search, and open Navigation at 390; and Home and Post at 768. I also reviewed the final dark Home and Post, the English Articles view, the real-article preview, long-content stress pages, empty states, auth pages, friend links, and the content images after scrolling them into view.

The site preserves the concept’s monochrome, text-led indexes and Home’s light → deep-black project scene → light writing → black footer rhythm. Project art stays mostly monochrome; color appears in actual article media. Articles, Tags, and Archive remain typographic indexes rather than card grids or pill clouds. The Post page has a calm reading column, useful contents navigation, and table/code/image treatments that still work at phone and tablet widths. The full-screen mobile menu is clear and easy to dismiss. The final localized site identity and description now agree with the `szweb.ren` wordmark. The compact reading-progress treatment at 768 and the back-to-top control no longer compete with the reading text.

The empty article-media map is an intentional content choice: the featured post has no configured cover, so the theme does not invent or randomize one. The selected-project visual still gives Home a strong visual anchor. The final dark Post captures show the lower article image loaded; the earlier blank rectangle was a full-page lazy-load capture artifact.

## Capability regression QA

| Existing capability | szweb entry / evidence | Verdict |
| --- | --- | --- |
| Home, pinned/popular/recent posts, view counts, RSS entry | `/`; existing post and pageview queries; browser grid | PASS |
| Article list, real tag filter, cursor load-more, summary/read time/views, preview and return | `/posts`; preview reads actual `contentJson` paragraphs; browser checks cover cursor load and preview/back restoration | PASS |
| Full-text search, snippets, clear/loading/error/empty, keyboard navigation | `/search`; existing search query; ↑/↓/Enter/Escape, Ctrl/Cmd+K, and forced-503/retry recovery checks | PASS |
| Archive and Tags | `/archive`, `/tags`; 245 published fixtures across six years; full year/month counts and tag index/filter | PASS |
| Post body, TOC, progress, code, formulas, tables, images, related posts | `/post/$slug`; table renderer now inserts `<tbody>`; final focused Post tests include TOC, code copy, image lightbox, and missing-post behavior | PASS |
| Comments, nested replies, deletion permissions, modal accessibility | Existing comment service and szweb presentation; final 24-check browser run verified admin root/reply/nested reply persistence, dialog focus/Escape/cancel/confirm, reader ownership and permissions, guest prompt, and mobile overflow | PASS |
| Login, registration, password recovery/verification, profile and logout | Existing auth routes/hooks with szweb pages; final 6-check auth/Post run and 12-check account run passed local form validation, profile persistence, logout route protection, and account entry behavior | PASS within local-provider limits |
| Public Friend Links and submission status | Existing friend-link service; public schema projects only public fields and filters unsafe protocols; account run verified a pending submission remains hidden from the approved list | PASS |
| Admin entry, OAuth consent, MCP, backup/export, default and fuwari themes | Existing routes/services remain present; changes to default/fuwari friend cards are limited to the revised safe public DTO shape | PASS by source and route preservation; MCP/backup were not independently exercised end-to-end |
| RSS, Atom, JSON Feed, sitemap, robots, manifest | Six local endpoints returned HTTP 200; sitemap includes new public routes | PASS |

Internal `_chroma:` tags are excluded from public post and tag metadata. The `PublicFriendLinkSchema` drops contact/moderation fields, accepts only HTTP(S) site URLs, and permits only HTTP(S) or root-relative image references. Tests cover hostile URL schemes and private-field removal.

## Engineering and accessibility evidence

The owner’s final checks reported 137 unit tests across 11 files, three local guard checks, TypeScript, client/SSR build, and lint with zero errors and three helper warnings. The stable local browser grid reported 40 views and 18 checks passing with no horizontal overflow, runtime errors, or external requests. The supplemental run passed 17 checks; the account run passed 12; the final focused product/auth run passed 6; and the final comment run passed 24 with zero page errors and external requests. Six feed endpoints returned HTTP 200.

Keyboard search, the mobile menu, image and comment dialogs, focus restoration/trapping, project arrow/Home/End navigation, and reduced-motion behavior were exercised. The comment editor’s link/image dialogs and delete confirmation retain focus behavior. The Post progress bar uses a semantic progressbar and does not announce every scroll update.

The reported main client bundle is 867.30 kB raw / 246.87 kB gzip; the Post chunk is 34.71 kB raw / 10.37 kB gzip, with the rich renderer/editor loaded on demand. Local Vite timing is a warm, unthrottled sanity check only; it is not production LCP evidence. I did not test production network conditions.

One separate browser report records a hydration warning on direct `/admin/settings` load inside the existing, unmodified Breadcrumbs component. Its baseline was not established, so I do not attribute it to szweb; it remains a known app-level warning rather than claiming a clean full-admin console. The final public/user grid and authenticated Post/comment runs had no runtime/page errors after the szweb fixes.

Email delivery and a live GitHub OAuth round trip were not tested: local SMTP and OAuth integrations are disabled or mocked. Invalid-token and blank-form states were tested locally. No claim is made about those external services.

## Production safety

All browser and worker validation used `http://localhost:3000` with the explicit `wrangler.local.jsonc`, local-only persistence, mock integrations, and outbound-request blocking. The final browser reports show `localOnly: true`, zero outbound blocks triggered, and zero external requests. Local guards reject production Wrangler bindings and ambiguous production/development dotenv files and validate the local environment against an allowlist.

This QA did not deploy, push, run a remote migration, or access production D1/R2/KV. No production credentials were used. The working tree remains uncommitted on `feat/szweb-theme` for user review.

## Review artifacts

Final screenshots are in `.local-dev/szweb-qa/final/`; supplemental dark/empty/error captures are in `.local-dev/szweb-qa/supplemental/`; focused Post/comment captures and machine-readable reports are in `.local-dev/szweb-qa/product/`. The concept comparison set is `.local-dev/concept-review/`. The main screenshots I relied on include:

- `.local-dev/szweb-qa/final/home-1440.png`, `articles-1440.png`, `post-1440.png`, `search-1440.png`, `archive-1440.png`
- `.local-dev/szweb-qa/final/home-390.png`, `articles-390.png`, `post-390.png`, `search-390.png`, `navigation-390.png`
- `.local-dev/szweb-qa/final/home-768.png`, `post-768.png`, `home-dark-1440.png`, `articles-english-1440.png`
- `.local-dev/szweb-qa/supplemental/post-dark-1440.png`, `post-dark-390.png`
- `.local-dev/szweb-qa/product/comments-thread-1440.png`, `reader-comments-390.png`, `comment-image-dialog-dark.png`

**Final answer to the maturity question: YES.** The design and tested core product paths pass independent review. The remaining limits are local-only verification of external auth/mail providers, unmeasured production performance, and the separate unproven-baseline Breadcrumbs hydration warning on the existing admin page.
