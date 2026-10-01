import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../../', import.meta.url));
export const configPath = path.join(root, 'wrangler.local.jsonc');
export const persistPath = path.join(root, '.wrangler/state-szweb');
export const privatePath = path.join(root, '.local-dev');
export const credentialHome = path.join(privatePath, 'home');
export const marker = 'szweb-local-v1';
export const expectedConfig = {
  $schema: 'node_modules/wrangler/config-schema.json',
  name: 'szweb-local-only',
  compatibility_date: '2026-02-17',
  compatibility_flags: ['nodejs_compat', 'global_fetch_strictly_public'],
  main: './scripts/local-dev/worker.ts',
  workers_dev: false,
  preview_urls: false,
  d1_databases: [{ binding: 'DB', database_name: 'szweb-local-db', database_id: '00000000-0000-0000-0000-000000000001', migrations_dir: 'migrations', remote: false }],
  r2_buckets: [{ binding: 'R2', bucket_name: 'szweb-local-media', remote: false }],
  kv_namespaces: [
    { binding: 'KV', id: '00000000000000000000000000000001', remote: false },
    { binding: 'OAUTH_KV', id: '00000000000000000000000000000002', remote: false },
  ],
  workflows: [
    ['POST_PROCESS_WORKFLOW', 'PostProcessWorkflow', 'post-process'],
    ['POST_AUTO_SNAPSHOT_WORKFLOW', 'PostAutoSnapshotWorkflow', 'post-auto-snapshot'],
    ['COMMENT_MODERATION_WORKFLOW', 'CommentModerationWorkflow', 'comment-moderation'],
    ['SCHEDULED_PUBLISH_WORKFLOW', 'ScheduledPublishWorkflow', 'scheduled-publish'],
    ['EXPORT_WORKFLOW', 'ExportWorkflow', 'export'],
    ['IMPORT_WORKFLOW', 'ImportWorkflow', 'import'],
  ].map(([binding, class_name, name]) => ({ binding, class_name, name: `szweb-local-${name}` })),
  durable_objects: { bindings: [
    { name: 'RATE_LIMITER', class_name: 'RateLimiter' },
    { name: 'PASSWORD_HASHER', class_name: 'PasswordHasher' },
  ] },
  queues: {
    producers: [{ binding: 'QUEUE', queue: 'szweb-local-queue' }],
    consumers: [{ queue: 'szweb-local-queue', max_batch_size: 10, max_batch_timeout: 1, max_retries: 1 }],
  },
  migrations: [
    { tag: 'rate-limiter-v1', new_sqlite_classes: ['RateLimiter'] },
    { tag: 'password-hasher-v1', new_sqlite_classes: ['PasswordHasher'] },
  ],
  vars: { LOCAL_DEV_ONLY: marker, ENVIRONMENT: 'dev' },
};

export function validateConfig(config, selectedConfig = configPath, selectedPersist = persistPath) {
  if (path.resolve(selectedConfig) !== configPath) throw new Error('LOCAL ONLY: must select wrangler.local.jsonc explicitly');
  if (path.resolve(selectedPersist) !== persistPath) throw new Error('LOCAL ONLY: unexpected persistence directory');
  const raw = JSON.stringify(config);
  if (/szweb\.ren|DOMAIN_PLACEHOLDER|"remote"\s*:\s*true/i.test(raw)) throw new Error('LOCAL ONLY: production domain or remote binding rejected');
  if ('account_id' in config || 'routes' in config || 'route' in config || 'ai' in config) throw new Error('LOCAL ONLY: account/routes/AI bindings are forbidden');
  try { assert.deepEqual(config, expectedConfig); }
  catch { throw new Error('LOCAL ONLY: config differs from the approved local resource allowlist (IDs, bindings, paths or flags)'); }
}

export function readLocalEnv(file) {
  const result = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const match = /^([A-Z_][A-Z_0-9]*)=(.*)$/.exec(line);
    if (!match || Object.hasOwn(result, match[1])) throw new Error(`LOCAL ONLY: invalid or duplicate variable in ${path.basename(file)}`);
    result[match[1]] = match[2].replace(/^(["'])(.*)\1$/, '$2');
  }
  return result;
}

export function validateEnv(runtime, build) {
  const fixed = {
    LOCAL_DEV_ONLY: marker, ENVIRONMENT: 'dev', BETTER_AUTH_URL: 'http://localhost:3000',
    ADMIN_EMAIL: 'admin@local.invalid', GITHUB_CLIENT_ID: 'local-disabled', GITHUB_CLIENT_SECRET: 'local-disabled',
    CLOUDFLARE_ZONE_ID: 'local-disabled', CLOUDFLARE_PURGE_API_TOKEN: 'local-disabled',
    DOMAIN: 'local.invalid', PAGEVIEW_SALT: 'local-fixture-only',
  };
  const { BETTER_AUTH_SECRET: localSecret, ...rest } = runtime;
  if (!/^local-only-[a-f0-9]{64}$/.test(localSecret ?? '')) throw new Error('LOCAL ONLY: missing generated local auth secret');
  try { assert.deepEqual(rest, fixed); assert.ok(['default', 'fuwari', 'szweb'].includes(build.THEME)); assert.deepEqual(build, { LOCAL_DEV_ONLY: marker, THEME: build.THEME, VITE_UMAMI_WEBSITE_ID: '', VITE_TURNSTILE_SITE_KEY: '' }); }
  catch { throw new Error('LOCAL ONLY: environment must contain only approved localhost/mock settings'); }
}

export function assertSafeFiles() {
  // The fixed dev/build commands only read development/production; the tracked
  // .env.test belongs to the upstream test suite, not either runtime mode.
  for (const name of ['wrangler.jsonc', 'wrangler.json', 'wrangler.toml', '.env', '.env.development', '.env.development.local', '.env.production', '.env.production.local', '.env.test.local']) {
    if (fs.existsSync(path.join(root, name))) throw new Error(`LOCAL ONLY: ambiguous default configuration ${name}; inspect it before starting`);
  }
  validateConfig(JSON.parse(fs.readFileSync(configPath, 'utf8')));
  validateEnv(readLocalEnv(path.join(root, '.dev.vars')), readLocalEnv(path.join(root, '.env.local')));
}

export function childEnvironment() {
  // Deliberately do not spread process.env: it may contain unrelated credentials.
  const env = {};
  for (const name of ['SystemRoot', 'SYSTEMROOT', 'windir', 'WINDIR', 'COMSPEC', 'ComSpec', 'PATH', 'Path', 'PATHEXT', 'TEMP', 'TMP', 'PROCESSOR_ARCHITECTURE', 'NUMBER_OF_PROCESSORS']) {
    if (process.env[name]) env[name] = process.env[name];
  }
  Object.assign(env, {
    HOME: credentialHome, USERPROFILE: credentialHome,
    APPDATA: path.join(credentialHome, 'AppData/Roaming'), LOCALAPPDATA: path.join(credentialHome, 'AppData/Local'),
    XDG_CONFIG_HOME: path.join(credentialHome, '.config'), WRANGLER_HOME: path.join(credentialHome, '.wrangler'),
    NPM_CONFIG_USERCONFIG: path.join(credentialHome, '.npmrc'),
    BUN_INSTALL_CACHE_DIR: path.join(privatePath, 'bun-cache'),
    WRANGLER_SEND_METRICS: 'false', CI: 'true', HUSKY: '0', LOCAL_DEV_ONLY: marker,
    CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: 'false',
  });
  for (const dir of [credentialHome, env.APPDATA, env.LOCALAPPDATA, env.XDG_CONFIG_HOME, env.WRANGLER_HOME]) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(env.NPM_CONFIG_USERCONFIG)) fs.writeFileSync(env.NPM_CONFIG_USERCONFIG, '');
  return env;
}

export function assertSafeLaunch(env = process.env) {
  assertSafeFiles();
  if (env.LOCAL_DEV_ONLY !== marker || env.USERPROFILE !== credentialHome || env.WRANGLER_HOME !== path.join(credentialHome, '.wrangler')) throw new Error('LOCAL ONLY: use bun run dev:local (isolated credential home required)');
  for (const key of ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN', 'CF_API_TOKEN', 'CF_ACCOUNT_ID', 'CLOUDFLARE_API_KEY', 'CF_API_KEY', 'CLOUDFLARE_ENV', 'CLOUDFLARE_VITE_WRANGLER_CONFIG_PATH']) {
    if (env[key]) throw new Error(`LOCAL ONLY: inherited ${key} is forbidden (value not shown)`);
  }
}
