import test from 'node:test';
import assert from 'node:assert/strict';
import { expectedConfig, validateConfig, configPath, persistPath, validateEnv, readLocalEnv, root, childEnvironment, assertSafeLaunch } from './guard.mjs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

test('approved configuration passes; any remote resource or alternate target fails before spawning', () => {
  assert.doesNotThrow(() => validateConfig(structuredClone(expectedConfig)));
  for (const change of [
    c => c.d1_databases[0].remote = true,
    c => c.kv_namespaces[0].id = '12345678901234567890123456789012',
    c => c.r2_buckets[0].bucket_name = 'production-media',
    c => c.vars.DOMAIN = 'szweb.ren',
    c => c.vars.DOMAIN = 'another-production.example',
    c => c.account_id = 'real-looking-account',
    c => c.routes = [{ pattern: 'another-production.example', custom_domain: true }],
    c => c.ai = { binding: 'AI', remote: true },
    c => c.services = [{ binding: 'PROXY', service: 'production' }],
    c => c.main = './src/server.ts',
  ]) { const cfg = structuredClone(expectedConfig); change(cfg); assert.throws(() => validateConfig(cfg), /LOCAL ONLY/); }
  assert.throws(() => validateConfig(expectedConfig, path.join(root, 'wrangler.jsonc')), /select/);
  assert.throws(() => validateConfig(expectedConfig, configPath, path.join(root, '.wrangler/state')), /persistence/);
});

test('Node preload blocks fetch, HTTP and TLS before opening external sockets', () => {
  for (const code of [
    "fetch('https://network-probe.invalid')",
    "require('node:http').get('http://network-probe.invalid')",
    "require('node:tls').connect({host:'network-probe.invalid',port:443})",
    "require('node:net').connect(443,'198.51.100.2')",
    "require('node:dns').lookup('network-probe.invalid',()=>{})",
    "new WebSocket('wss://network-probe.invalid')",
  ]) {
    const result = spawnSync(process.execPath, ['--require', path.join(root, 'scripts/local-dev/node-network.cjs'), '-e', code], { env: childEnvironment(), encoding: 'utf8', timeout: 5000 });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /LOCAL ONLY: outbound connection blocked/);
  }
});

test('runtime flags, third-party settings, local secret and credential isolation fail closed', () => {
  const vars = readLocalEnv(path.join(root, '.dev.vars'));
  const build = readLocalEnv(path.join(root, '.env.local'));
  assert.doesNotThrow(() => validateEnv(vars, build));
  for (const patch of [{ ENVIRONMENT: 'prod' }, { DOMAIN: 'szweb.ren' }, { GITHUB_CLIENT_ID: 'real-client' }, { SMTP_HOST: 'smtp.example.com' }, { BETTER_AUTH_SECRET: 'not-generated-locally' }]) {
    assert.throws(() => validateEnv({ ...vars, ...patch }, build), /LOCAL ONLY/);
  }
  const env = childEnvironment();
  assert.equal(env.CLOUDFLARE_API_TOKEN, undefined);
  assert.equal(env.NODE_OPTIONS, undefined);
  assert.doesNotThrow(() => assertSafeLaunch(env));
  assert.throws(() => assertSafeLaunch({ ...env, LOCAL_DEV_ONLY: '' }), /LOCAL ONLY/);
  assert.throws(() => assertSafeLaunch({ ...env, CLOUDFLARE_API_TOKEN: 'test-forbidden' }), /LOCAL ONLY/);
  assert.throws(() => assertSafeLaunch({ ...env, USERPROFILE: 'C:/Users/someone' }), /LOCAL ONLY/);
  assert.equal(persistPath, path.join(root, '.wrangler/state-szweb'));
});
