import assert from "node:assert/strict";
import { createHash, randomBytes, scryptSync } from "node:crypto";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { insert, save } from "@orama/orama";
import { getPlatformProxy } from "wrangler";
import { createMyDb } from "../../src/features/search/model/schema.ts";
import {
  FIXTURE_ARTICLES as BASE_FIXTURE_ARTICLES,
  buildArticleContent,
  FIXTURE_AVATAR_URL,
  FIXTURE_BANNER_URL,
  FIXTURE_CLEANUP_ARTICLES,
  FIXTURE_FRIEND_LINKS,
  FIXTURE_IMAGES,
  FIXTURE_MARKER,
  FIXTURE_TEST_PASSWORD,
  FIXTURE_USERS,
  getFixtureArticles,
} from "./fixtures.ts";
import { assertSafeLaunch, configPath, persistPath, root } from "./guard.mjs";

const fixtureTable = "local_fixture_meta";
const fixtureSearchKey = "search:index:v3";
const fixtureSearchMetaKey = "search:index:meta:v3";
const MAX_D1_BINDINGS_PER_STATEMENT = 80;
const localFixtureStressFlag = process.env.LOCAL_FIXTURE_STRESS;
assert(
  localFixtureStressFlag === undefined || localFixtureStressFlag === "1",
  "LOCAL ONLY: unsupported fixture stress mode.",
);
const FIXTURE_ARTICLES = getFixtureArticles(localFixtureStressFlag === "1");
assert(
  FIXTURE_ARTICLES.length ===
    BASE_FIXTURE_ARTICLES.length + (localFixtureStressFlag === "1" ? 220 : 0),
  "LOCAL ONLY: fixture article count does not match the selected mode.",
);
const timestampSeconds = () => Math.floor(Date.now() / 1000);

type D1Statement = {
  bind(...values: (string | number | null | Uint8Array)[]): D1Statement;
  first<
    T extends Record<string, unknown> = Record<string, unknown>,
  >(): Promise<T | null>;
  all<T extends Record<string, unknown> = Record<string, unknown>>(): Promise<{
    results: T[];
  }>;
  run(): Promise<unknown>;
};

type LocalD1 = {
  prepare(sql: string): D1Statement;
  batch(statements: D1Statement[]): Promise<unknown[]>;
};

type LocalKV = {
  put(key: string, value: string | Uint8Array): Promise<unknown>;
  list(options?: { cursor?: string }): Promise<{
    keys: { name: string }[];
    list_complete: boolean;
    cursor?: string;
  }>;
  delete(key: string): Promise<void>;
};

type LocalR2 = {
  put(
    key: string,
    value: Uint8Array,
    options?: {
      httpMetadata?: { contentType?: string };
      customMetadata?: Record<string, string>;
    },
  ): Promise<unknown>;
};

type LocalBindings = { DB: LocalD1; KV: LocalKV; R2: LocalR2 };
type FixturePostRow = { id: number; slug: string };
type FixtureTagRow = { id: number; name: string };
type FixtureMetaRow = { fixture_key: string; marker: string };
type SystemConfigRow = { id: number; config_json: string | null };

const appTables = [
  "user",
  "session",
  "account",
  "verification",
  "posts",
  "tags",
  "post_tags",
  "comments",
  "email_unsubscriptions",
  "media",
  "post_media",
  "page_views",
  "system_config",
  "friend_links",
  "post_revisions",
] as const;

function getBindings(env: Record<string, unknown>): LocalBindings {
  const DB = env.DB as LocalD1 | undefined;
  const KV = env.KV as LocalKV | undefined;
  const R2 = env.R2 as LocalR2 | undefined;
  assert(DB?.prepare && DB.batch, "The local D1 binding is unavailable.");
  assert(KV?.put, "The local KV binding is unavailable.");
  assert(R2?.put, "The local R2 binding is unavailable.");
  return { DB, KV, R2 };
}

function placeholders(count: number) {
  assert(count > 0, "Expected at least one SQL placeholder.");
  return Array.from({ length: count }, () => "?").join(", ");
}

function splitIntoBatches<T>(values: Array<T>, size: number) {
  const batches: Array<Array<T>> = [];
  for (let start = 0; start < values.length; start += size) {
    batches.push(values.slice(start, start + size));
  }
  return batches;
}

async function queryAll<T extends Record<string, unknown>>(
  db: LocalD1,
  sql: string,
  values: (string | number | null | Uint8Array)[] = [],
) {
  const statement = db.prepare(sql);
  return (await statement.bind(...values).all<T>()).results;
}

async function queryFirst<T extends Record<string, unknown>>(
  db: LocalD1,
  sql: string,
  values: (string | number | null | Uint8Array)[] = [],
) {
  return await db
    .prepare(sql)
    .bind(...values)
    .first<T>();
}

async function run(
  db: LocalD1,
  sql: string,
  values: (string | number | null | Uint8Array)[] = [],
) {
  await db
    .prepare(sql)
    .bind(...values)
    .run();
}

async function ensureOwnedFixtureDatabase(db: LocalD1) {
  const markerTable = await queryFirst<{ name: string }>(
    db,
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    [fixtureTable],
  );

  if (markerTable) {
    const markers = await queryAll<FixtureMetaRow>(
      db,
      `SELECT fixture_key, marker FROM ${fixtureTable}`,
    );
    assert(
      markers.length === 1 &&
        markers[0].fixture_key === "main" &&
        markers[0].marker === FIXTURE_MARKER,
      "This D1 database has an unknown or incomplete fixture marker; refusing to modify it.",
    );
    return;
  }

  for (const table of appTables) {
    const row = await queryFirst<{ count: number }>(
      db,
      `SELECT COUNT(*) AS count FROM ${table}`,
    );
    assert(
      Number(row?.count ?? 0) === 0,
      `The local D1 database is not empty (table ${table}); refusing to seed without a matching marker.`,
    );
  }

  const now = timestampSeconds();
  await db.batch([
    db.prepare(
      `CREATE TABLE ${fixtureTable} (fixture_key TEXT PRIMARY KEY NOT NULL, marker TEXT NOT NULL, updated_at INTEGER NOT NULL)`,
    ),
    db
      .prepare(
        `INSERT INTO ${fixtureTable} (fixture_key, marker, updated_at) VALUES (?, ?, ?)`,
      )
      .bind("main", FIXTURE_MARKER, now),
  ]);
}

async function removeOwnedFixtureRows(db: LocalD1) {
  const slugs = FIXTURE_CLEANUP_ARTICLES.map((article) => article.slug);
  const oldPosts: Array<FixturePostRow> = [];
  for (const slugBatch of splitIntoBatches(
    slugs,
    MAX_D1_BINDINGS_PER_STATEMENT,
  )) {
    oldPosts.push(
      ...(await queryAll<FixturePostRow>(
        db,
        `SELECT id, slug FROM posts WHERE slug IN (${placeholders(slugBatch.length)})`,
        slugBatch,
      )),
    );
  }
  const postIds = oldPosts.map((post) => post.id);

  for (const postIdBatch of splitIntoBatches(
    postIds,
    MAX_D1_BINDINGS_PER_STATEMENT,
  )) {
    const postIdPlaceholders = placeholders(postIdBatch.length);
    for (const table of [
      "post_media",
      "post_tags",
      "post_revisions",
      "page_views",
      "comments",
    ]) {
      await run(
        db,
        `DELETE FROM ${table} WHERE post_id IN (${postIdPlaceholders})`,
        postIdBatch,
      );
    }
    await run(
      db,
      `DELETE FROM posts WHERE id IN (${postIdPlaceholders})`,
      postIdBatch,
    );
  }

  const userIds = FIXTURE_USERS.map((user) => user.id);
  const emails = FIXTURE_USERS.map((user) => user.email);
  const idList = placeholders(userIds.length);
  const emailList = placeholders(emails.length);
  const ownedUsers = `user_id IN (${idList}) OR user_id IN (SELECT id FROM user WHERE email IN (${emailList}))`;
  const ownedUsersValues = [...userIds, ...emails];

  await run(
    db,
    `DELETE FROM friend_links WHERE site_name IN (${placeholders(FIXTURE_FRIEND_LINKS.length)})`,
    FIXTURE_FRIEND_LINKS.map((link) => link.siteName),
  );
  await run(db, `DELETE FROM session WHERE ${ownedUsers}`, ownedUsersValues);
  await run(db, `DELETE FROM account WHERE ${ownedUsers}`, ownedUsersValues);
  await run(
    db,
    `DELETE FROM verification WHERE identifier IN (${emailList})`,
    emails,
  );
  await run(
    db,
    `DELETE FROM user WHERE id IN (${idList}) OR email IN (${emailList})`,
    [...userIds, ...emails],
  );

  const mediaKeys = FIXTURE_IMAGES.map((image) => image.key);
  await run(
    db,
    `DELETE FROM media WHERE key IN (${placeholders(mediaKeys.length)})`,
    mediaKeys,
  );
}

function makePasswordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password.normalize("NFKC"), salt, 64, {
    N: 16_384,
    r: 16,
    p: 1,
    maxmem: 128 * 16_384 * 16 * 2,
  });
  return `${salt}:${key.toString("hex")}`;
}

async function seedUsers(db: LocalD1, nowMs: number) {
  const passwordHash = makePasswordHash(FIXTURE_TEST_PASSWORD);
  for (const fixtureUser of FIXTURE_USERS) {
    await run(
      db,
      `INSERT INTO user (id, name, email, email_verified, image, created_at, updated_at, role, banned, ban_reason, ban_expires)
       VALUES (?, ?, ?, 1, NULL, ?, ?, ?, 0, NULL, NULL)`,
      [
        fixtureUser.id,
        fixtureUser.name,
        fixtureUser.email,
        nowMs,
        nowMs,
        fixtureUser.role,
      ],
    );
    await run(
      db,
      `INSERT INTO account (id, account_id, provider_id, user_id, access_token, refresh_token, id_token, access_token_expires_at, refresh_token_expires_at, scope, password, created_at, updated_at)
       VALUES (?, ?, 'credential', ?, NULL, NULL, NULL, NULL, NULL, NULL, ?, ?, ?)`,
      [
        `local-fixture-account-${fixtureUser.id.replace("local-fixture-", "")}`,
        fixtureUser.id,
        fixtureUser.id,
        passwordHash,
        nowMs,
        nowMs,
      ],
    );
  }
}

async function writeFixtureImages(R2: LocalR2) {
  for (const image of FIXTURE_IMAGES) {
    await R2.put(image.key, new TextEncoder().encode(image.svg), {
      httpMetadata: { contentType: "image/svg+xml" },
      customMetadata: { fixture: FIXTURE_MARKER },
    });
  }
}

async function seedMedia(db: LocalD1, now: number) {
  const mediaValues = FIXTURE_IMAGES.map(
    (image) =>
      [
        image.key,
        `/images/${image.key}`,
        image.fileName,
        image.width,
        image.height,
        "image/svg+xml",
        Buffer.byteLength(image.svg, "utf8"),
        now,
      ] as (string | number | null)[],
  );

  for (const values of mediaValues) {
    await run(
      db,
      `INSERT INTO media (key, url, file_name, width, height, mime_type, size_in_bytes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      values,
    );
  }
}

async function seedArticles(db: LocalD1, now: number) {
  const allTags = [
    ...new Set(FIXTURE_ARTICLES.flatMap((article) => article.tags)),
  ];
  for (const name of allTags) {
    await run(
      db,
      "INSERT OR IGNORE INTO tags (name, created_at) VALUES (?, ?)",
      [name, now],
    );
  }
  const tagRows = await queryAll<FixtureTagRow>(
    db,
    `SELECT id, name FROM tags WHERE name IN (${placeholders(allTags.length)})`,
    allTags,
  );
  const tagIds = new Map(tagRows.map((tag) => [tag.name, tag.id]));
  assert(tagIds.size === allTags.length, "Could not resolve all fixture tags.");

  const postIds = new Map<string, number>();
  const contents = new Map<string, ReturnType<typeof buildArticleContent>>();
  const createdAt = now;

  for (const [index, article] of FIXTURE_ARTICLES.entries()) {
    const content = buildArticleContent(article);
    const publishedAt =
      article.status === "scheduled"
        ? now + (article.futureDaysFromNow ?? 14) * 86_400
        : article.status === "draft"
          ? null
          : now - (article.publishedDaysAgo ?? 1) * 86_400;
    const pinnedAt =
      article.pinnedDaysAgo === undefined
        ? null
        : now - article.pinnedDaysAgo * 86_400;
    const status = article.status === "draft" ? "draft" : "published";
    const publicContent = article.status === "published" ? content : null;

    const inserted = await queryFirst<{ id: number }>(
      db,
      `INSERT INTO posts (title, summary, read_time_in_minutes, slug, content_json, public_content_json, status, published_at, pinned_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [
        article.title,
        article.summary,
        article.readTime,
        article.slug,
        JSON.stringify(content),
        publicContent ? JSON.stringify(publicContent) : null,
        status,
        publishedAt,
        pinnedAt,
        createdAt - index * 43_200,
        now,
      ],
    );
    assert(inserted?.id, `Could not create fixture article ${article.slug}.`);
    postIds.set(article.slug, Number(inserted.id));
    contents.set(article.slug, content);

    for (const name of article.tags) {
      const tagId = tagIds.get(name);
      assert(tagId, `Could not resolve fixture tag ${name}.`);
      await run(db, "INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)", [
        inserted.id,
        tagId,
      ]);
    }
  }

  return { postIds, contents };
}

function plainTextFromContent(doc: ReturnType<typeof buildArticleContent>) {
  const parts: string[] = [];
  const blockTypes = new Set([
    "paragraph",
    "heading",
    "codeBlock",
    "blockquote",
    "listItem",
    "bulletList",
    "orderedList",
  ]);

  function visit(node: Record<string, unknown>) {
    if (node.type === "text" && typeof node.text === "string")
      parts.push(node.text);
    if (
      node.type === "image" &&
      node.attrs &&
      typeof node.attrs === "object" &&
      typeof (node.attrs as Record<string, unknown>).alt === "string"
    ) {
      parts.push(` ${(node.attrs as Record<string, string>).alt} `);
    }
    if (Array.isArray(node.content)) {
      for (const child of node.content) visit(child as Record<string, unknown>);
    }
    if (typeof node.type === "string" && blockTypes.has(node.type))
      parts.push("\n");
  }

  visit(doc as unknown as Record<string, unknown>);
  return parts.join("").replace(/\n+/g, "\n").trim();
}

async function persistSearchIndex(
  KV: LocalKV,
  contents: Map<string, ReturnType<typeof buildArticleContent>>,
  postIds: Map<string, number>,
) {
  const db = await createMyDb();
  const published = FIXTURE_ARTICLES.filter(
    (article) => article.status === "published",
  );

  for (const article of published) {
    const id = postIds.get(article.slug);
    const content = contents.get(article.slug);
    assert(
      id !== undefined && content,
      `Missing published article ${article.slug} for search.`,
    );
    const plain = plainTextFromContent(content);
    await insert(db, {
      id: String(id),
      slug: article.slug,
      title: article.title,
      summary: article.summary.trim() ? article.summary : plain.slice(0, 200),
      content: plain.slice(0, 10_000),
      tags: article.tags,
    });
  }

  const raw = save(db);
  const encoded = new TextEncoder().encode(JSON.stringify(raw));
  const compressed = new Uint8Array(gzipSync(encoded));

  await KV.put(fixtureSearchKey, compressed);
  const version = Date.now().toString();
  await KV.put(
    fixtureSearchMetaKey,
    JSON.stringify({
      version,
      updatedAt: new Date().toISOString(),
      sizeInBytes: compressed.byteLength,
    }),
  );
}

async function insertPageViews(
  db: LocalD1,
  postIds: Map<string, number>,
  now: number,
) {
  const values: (string | number | null | Uint8Array)[][] = [];
  for (const article of FIXTURE_ARTICLES) {
    if (article.status !== "published") continue;
    const postId = postIds.get(article.slug);
    assert(postId !== undefined, `Missing post id for ${article.slug}.`);
    const lifetimeDays = article.publishedDaysAgo ?? 1;
    for (let view = 0; view < article.views; view++) {
      const ageDays = lifetimeDays * (1 - (view + 1) / (article.views + 1));
      const visitorHash = createHash("sha256")
        .update(`fixture:${article.slug}:${view % 41}`)
        .digest("hex");
      values.push([postId, visitorHash, now - Math.floor(ageDays * 86_400)]);
    }
  }

  const perStatement = 30;
  for (let offset = 0; offset < values.length; offset += perStatement) {
    const chunk = values.slice(offset, offset + perStatement);
    const row = "(?, ?, ?)";
    const sql = `INSERT INTO page_views (post_id, visitor_hash, created_at) VALUES ${chunk.map(() => row).join(", ")}`;
    await db
      .prepare(sql)
      .bind(...chunk.flat())
      .run();
  }
}

async function insertComment(
  db: LocalD1,
  input: {
    postId: number;
    userId: string;
    text: string;
    createdAt: number;
    rootId: number | null;
    replyTo: number | null;
  },
) {
  const content = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: input.text }],
      },
    ],
  };
  const row = await queryFirst<{ id: number }>(
    db,
    `INSERT INTO comments (content, root_id, reply_to_comment_id, status, ai_reason, post_id, user_id, created_at, updated_at)
     VALUES (?, ?, ?, 'published', NULL, ?, ?, ?, ?) RETURNING id`,
    [
      JSON.stringify(content),
      input.rootId,
      input.replyTo,
      input.postId,
      input.userId,
      input.createdAt,
      input.createdAt,
    ],
  );
  assert(row?.id, "Could not create a fixture comment.");
  return Number(row.id);
}

async function seedComments(
  db: LocalD1,
  postIds: Map<string, number>,
  now: number,
) {
  const articleSlugs = FIXTURE_ARTICLES.filter(
    (article) => article.status === "published",
  )
    .slice(0, 5)
    .map((article) => article.slug);

  for (const [index, slug] of articleSlugs.entries()) {
    const postId = postIds.get(slug);
    assert(
      postId !== undefined,
      `Missing post id for comment fixture ${slug}.`,
    );
    const rootId = await insertComment(db, {
      postId,
      userId: "local-fixture-reader-a",
      text: `This note made me think of a small example from my week ${index + 1}.`,
      createdAt: now - (index + 1) * 5_600,
      rootId: null,
      replyTo: null,
    });
    const replyId = await insertComment(db, {
      postId,
      userId: "local-fixture-writer",
      text: "Thanks for adding that detail. I will keep it in the next revision.",
      createdAt: now - (index + 1) * 4_900,
      rootId,
      replyTo: rootId,
    });
    await insertComment(db, {
      postId,
      userId: "local-fixture-reader-b",
      text: "A follow-up reply at the second level of this thread.",
      createdAt: now - (index + 1) * 4_200,
      rootId,
      replyTo: replyId,
    });
    await insertComment(db, {
      postId,
      userId: "local-fixture-reader-c",
      text: "A sibling reply to the original comment.",
      createdAt: now - (index + 1) * 3_500,
      rootId,
      replyTo: rootId,
    });
  }
}

async function seedFriendLinks(db: LocalD1, now: number) {
  for (const [index, link] of FIXTURE_FRIEND_LINKS.entries()) {
    const rejectionReason =
      link.status === "rejected"
        ? "A sample moderation reason for the local preview."
        : null;
    await run(
      db,
      `INSERT INTO friend_links (site_name, site_url, description, logo_url, contact_email, status, rejection_reason, user_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        link.siteName,
        link.siteUrl,
        link.description,
        `/images/${link.logoKey === "local-fixtures/avatar.svg" ? "asset/local-fixtures/avatar.svg" : link.logoKey}?original=true`,
        link.contactEmail,
        link.status,
        rejectionReason,
        link.userId,
        now - (index + 1) * 86_400,
        now,
      ],
    );
  }
}

async function seedSiteConfig(db: LocalD1, now: number) {
  const current = await queryFirst<SystemConfigRow>(
    db,
    "SELECT id, config_json FROM system_config ORDER BY id LIMIT 1",
  );
  let config: Record<string, unknown> = {};
  if (current?.config_json) {
    const parsed: unknown = JSON.parse(current.config_json);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      config = parsed as Record<string, unknown>;
    }
  }

  const priorSite = (
    config.site && typeof config.site === "object" ? config.site : {}
  ) as Record<string, unknown>;
  const priorTheme = (
    priorSite.theme && typeof priorSite.theme === "object"
      ? priorSite.theme
      : {}
  ) as Record<string, unknown>;
  const priorFuwari = (
    priorTheme.fuwari && typeof priorTheme.fuwari === "object"
      ? priorTheme.fuwari
      : {}
  ) as Record<string, unknown>;
  const site = {
    ...priorSite,
    title: "szweb.ren",
    author: "szweb",
    description: "关于开发、设计与日常的记录。",
    social: [
      { platform: "email", url: "mailto:hello@local.invalid", label: "Email" },
      { platform: "rss", url: "/rss.xml", label: "RSS" },
    ],
    theme: {
      ...priorTheme,
      fuwari: {
        ...priorFuwari,
        homeBg: FIXTURE_BANNER_URL,
        avatar: FIXTURE_AVATAR_URL,
      },
    },
  };
  const updated = {
    ...config,
    site,
    // Show email/password forms locally; the transport remains a throwing mock.
    email: {
      host: "smtp.local.invalid",
      port: 465,
      username: "local-only",
      password: "local-disabled",
      senderName: "Local Fixture",
      senderAddress: "sender@local.invalid",
    },
    notification: {
      admin: { channels: { email: false, webhook: false } },
      user: { emailEnabled: false },
      webhooks: [],
    },
  };
  const serialized = JSON.stringify(updated);

  if (current) {
    await run(
      db,
      "UPDATE system_config SET config_json = ?, updated_at = ? WHERE id = ?",
      [serialized, now, current.id],
    );
  } else {
    await run(
      db,
      "INSERT INTO system_config (config_json, updated_at) VALUES (?, ?)",
      [serialized, now],
    );
  }
}

async function updateMarker(db: LocalD1, now: number) {
  await run(
    db,
    `UPDATE ${fixtureTable} SET updated_at = ? WHERE fixture_key = 'main' AND marker = ?`,
    [now, FIXTURE_MARKER],
  );
}

async function seedLocalFixtures(bindings: LocalBindings) {
  const { DB, KV, R2 } = bindings;
  await ensureOwnedFixtureDatabase(DB);
  // Only the explicitly allowlisted local KV; invalidate old page/config caches.
  let cursor: string | undefined;
  do {
    const listing = await KV.list({ cursor });
    await Promise.all(listing.keys.map((key) => KV.delete(key.name)));
    cursor = listing.list_complete ? undefined : listing.cursor;
  } while (cursor);
  await removeOwnedFixtureRows(DB);

  const now = timestampSeconds();
  await writeFixtureImages(R2);
  await seedUsers(DB, Date.now());
  await seedMedia(DB, now);
  const { postIds, contents } = await seedArticles(DB, now);
  await insertPageViews(DB, postIds, now);
  await seedComments(DB, postIds, now);
  await seedFriendLinks(DB, now);
  await seedSiteConfig(DB, now);
  await persistSearchIndex(KV, contents, postIds);
  await updateMarker(DB, now);

  const publishedCount = FIXTURE_ARTICLES.filter(
    (article) => article.status === "published",
  ).length;
  const draftCount = FIXTURE_ARTICLES.filter(
    (article) => article.status === "draft",
  ).length;
  const scheduledCount = FIXTURE_ARTICLES.filter(
    (article) => article.status === "scheduled",
  ).length;
  console.log(
    `Seeded local fixtures: ${FIXTURE_ARTICLES.length} articles (${publishedCount} published, ${draftCount} drafts, ${scheduledCount} scheduled), ${FIXTURE_FRIEND_LINKS.length} friend links, ${FIXTURE_IMAGES.length} SVG assets. No credentials were printed.`,
  );
}

async function main() {
  process.chdir(root);
  assertSafeLaunch();

  const config = JSON.parse(
    await (await import("node:fs/promises")).readFile(configPath, "utf8"),
  ) as {
    d1_databases?: Array<{ binding?: string; remote?: boolean }>;
    kv_namespaces?: Array<{ binding?: string; remote?: boolean }>;
    r2_buckets?: Array<{ binding?: string; remote?: boolean }>;
  };
  assert(
    config.d1_databases?.some(
      (binding) => binding.binding === "DB" && binding.remote === false,
    ),
  );
  assert(
    config.kv_namespaces?.some(
      (binding) => binding.binding === "KV" && binding.remote === false,
    ),
  );
  assert(
    config.r2_buckets?.some(
      (binding) => binding.binding === "R2" && binding.remote === false,
    ),
  );

  const localMiniflareRoot = path.join(persistPath, "v3");
  const platform = await getPlatformProxy({
    configPath,
    envFiles: [],
    remoteBindings: false,
    persist: { path: localMiniflareRoot },
  });

  try {
    await seedLocalFixtures(
      getBindings(platform.env as Record<string, unknown>),
    );
  } finally {
    await platform.dispose();
  }
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unknown local fixture error.";
  const safeMessage = message.replace(
    /((?:password|secret|token)\s*[:=]\s*)[^\s,;]+/gi,
    "$1[redacted]",
  );
  console.error(`LOCAL ONLY fixture seed failed: ${safeMessage}`);
  process.exitCode = 1;
});
