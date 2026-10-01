import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { prepareOfflineBuild } from './offline-build.mjs';
import { root, configPath, persistPath, privatePath, expectedConfig, marker, assertSafeFiles, childEnvironment } from './guard.mjs';

const action = process.argv[2];
const extra = process.argv.slice(3);
if (extra.length) throw new Error('LOCAL ONLY: extra CLI arguments are not allowed');
process.chdir(root);
const env = childEnvironment();

if (action === 'init') {
  // Local copy derives from the example's DO/workflow contract; no example edits.
  const source = JSON.parse(fs.readFileSync(path.join(root, 'wrangler.example.jsonc'), 'utf8'));
  if (source.durable_objects.bindings.map(x => x.class_name).join() !== expectedConfig.durable_objects.bindings.map(x => x.class_name).join()) throw new Error('Review changed example bindings before initializing');
  const outputs = {
    'wrangler.local.jsonc': JSON.stringify(expectedConfig, null, 2) + '\n',
    '.env.local': `LOCAL_DEV_ONLY=${marker}\nTHEME=szweb\nVITE_UMAMI_WEBSITE_ID=\nVITE_TURNSTILE_SITE_KEY=\n`,
    '.dev.vars': `LOCAL_DEV_ONLY=${marker}\nENVIRONMENT=dev\nBETTER_AUTH_URL=http://localhost:3000\nBETTER_AUTH_SECRET=local-only-${randomBytes(32).toString('hex')}\nADMIN_EMAIL=admin@local.invalid\nGITHUB_CLIENT_ID=local-disabled\nGITHUB_CLIENT_SECRET=local-disabled\nCLOUDFLARE_ZONE_ID=local-disabled\nCLOUDFLARE_PURGE_API_TOKEN=local-disabled\nDOMAIN=local.invalid\nPAGEVIEW_SALT=local-fixture-only\n`,
  };
  for (const [name, content] of Object.entries(outputs)) if (!fs.existsSync(path.join(root, name))) fs.writeFileSync(path.join(root, name), content, { flag: 'wx' });
  assertSafeFiles();
  console.log('Local configuration initialized; no credentials displayed.');
  process.exit(0);
}

assertSafeFiles();
console.log(`LOCAL ONLY CHECK PASSED\nConfig: ${configPath}\nPersistence: ${persistPath}\nRemote: disabled; production tokens: not inherited; credential home: isolated`);
if (action === 'check') process.exit(0);

const bun = process.env.LOCAL_BUN_BINARY || (process.versions.bun ? process.execPath : path.join(os.homedir(), '.bun/codex-portable/1.4.2/bun-windows-x64/bun.exe'));
const node = process.versions.bun ? 'node' : process.execPath;
let command, args;
if (action === 'install') { command = bun; args = ['install', '--frozen-lockfile', '--ignore-scripts']; }
else if (action === 'migrate') { command = node; args = ['node_modules/wrangler/bin/wrangler.js', 'd1', 'migrations', 'apply', 'DB', '--local', '--config', configPath, '--persist-to', persistPath]; }
else if (action === 'seed' || action === 'seed-stress') {
  command = node;
  args = ['scripts/local-dev/seed.ts'];
  if (action === 'seed-stress') env.LOCAL_FIXTURE_STRESS = '1';
}
else if (action === 'i18n') { command = node; args = ['scripts/local-dev/compile-i18n.mjs']; }
else if (action === 'smoke' || action === 'theme-smoke' || action === 'fold-smoke' || action === 'folio-smoke') {
  env.LOCAL_PLAYWRIGHT_PATH = process.env.LOCAL_PLAYWRIGHT_PATH || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  command = node; args = [action === 'folio-smoke' ? 'scripts/local-dev/folio-smoke.mjs' : action === 'fold-smoke' ? 'scripts/local-dev/zheye-smoke.mjs' : action === 'theme-smoke' ? 'scripts/local-dev/szweb-smoke.mjs' : 'scripts/local-dev/browser-smoke.mjs'];
}
else if (action === 'start') { command = node; args = ['node_modules/vite/bin/vite.js', 'dev', '--host', 'localhost', '--port', '3000', '--strictPort']; }
else if (action === 'typecheck') { command = node; args = ['node_modules/typescript/bin/tsc', '--noEmit']; }
else if (action === 'lint') { command = node; args = ['node_modules/@biomejs/biome/bin/biome', 'lint']; }
else if (action === 'test') { command = node; args = ['node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.node.config.ts']; }
else if (action === 'build') { command = node; args = ['node_modules/vite/bin/vite.js', 'build']; }
else throw new Error('Usage: node scripts/local-dev/run.mjs init|install|check|migrate|seed|seed-stress|i18n|start|typecheck|lint|test|build|smoke|theme-smoke|fold-smoke|folio-smoke');

if (action === 'start' || action === 'i18n' || action === 'build') prepareOfflineBuild();
if (action !== 'install') {
  env.NODE_OPTIONS = `--require="${path.join(root, 'scripts/local-dev/node-network.cjs').replaceAll('\\', '/')}"`;
  env.LOCAL_DEV_NETWORK_LOG = path.join(privatePath, 'network.ndjson');
}
if (action === 'start' || action === 'build') {
  const translations = spawnSync(node, ['scripts/local-dev/compile-i18n.mjs'], { cwd: root, env, stdio: 'inherit' });
  if (translations.status !== 0) process.exit(translations.status ?? 1);
}
if (action === 'build') {
  const manifest = spawnSync(node, ['scripts/generate-manifest.ts'], { cwd: root, env, stdio: 'inherit' });
  if (manifest.status !== 0) process.exit(manifest.status ?? 1);
}
const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit' });
if (result.error) throw result.error;
if (action === 'install' && result.status === 0) {
  const plugins = spawnSync(node, ['scripts/local-dev/offline-build.mjs', 'install-plugins'], { cwd: root, env, stdio: 'inherit' });
  process.exit(plugins.status ?? 1);
}
process.exit(result.status ?? 1);
