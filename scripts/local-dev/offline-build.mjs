import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { root, privatePath } from './guard.mjs';

// Existing inlang project dependencies, cached with integrity checks for offline dev.
const plugins = [
  ['message-format.mjs', 'https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@4/dist/index.js', 'b22cf60eb28b3c8c3ce1fb6300611a0552f12d0d995d37c4dd2c96e3ad80c645'],
  ['function-matcher.mjs', 'https://cdn.jsdelivr.net/npm/@inlang/plugin-m-function-matcher@2/dist/index.js', '85862f6305793b56bfd9afe5368b096e63fb2aeab38b7799c051517be3499c0b'],
];
const pluginDirectory = path.join(privatePath, 'inlang-plugins');
export async function installBuildPlugins() {
  fs.mkdirSync(pluginDirectory, { recursive: true });
  for (const [name, url, sha] of plugins) {
    const file = path.join(pluginDirectory, name);
    const bytes = fs.existsSync(file) ? fs.readFileSync(file) : Buffer.from(await (await fetch(url)).arrayBuffer());
    if (createHash('sha256').update(bytes).digest('hex') !== sha) throw new Error(`LOCAL ONLY: inlang integrity mismatch: ${name}`);
    if (!fs.existsSync(file)) fs.writeFileSync(file, bytes);
  }
}

export function prepareOfflineBuild() {
  for (const [name, , sha] of plugins) {
    const file = path.join(pluginDirectory, name);
    if (!fs.existsSync(file) || createHash('sha256').update(fs.readFileSync(file)).digest('hex') !== sha) throw new Error('Run the guarded install command to cache inlang dependencies first');
  }
  const projectDirectory = path.join(privatePath, 'project.inlang');
  fs.mkdirSync(projectDirectory, { recursive: true });
  const settings = JSON.parse(fs.readFileSync(path.join(root, 'project.inlang/settings.json'), 'utf8'));
  settings.telemetry = 'off';
  settings.modules = plugins.map(([name]) => `./inlang-plugins/${name}`);
  settings['plugin.inlang.messageFormat'].pathPattern = '../messages/{locale}.json';
  fs.writeFileSync(path.join(projectDirectory, 'settings.json'), JSON.stringify(settings, null, 2));
  // Miniflare otherwise fetches public edge metadata before starting. Local mock only.
  const cfDirectory = path.join(root, 'node_modules/.mf');
  fs.mkdirSync(cfDirectory, { recursive: true });
  fs.writeFileSync(path.join(cfDirectory, 'cf.json'), JSON.stringify({ country: 'XX', city: 'Local sandbox', timezone: 'UTC', colo: 'LOCAL' }));
}

if (process.argv[2] === 'install-plugins') await installBuildPlugins();
