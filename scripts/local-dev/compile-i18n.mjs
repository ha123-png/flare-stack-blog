import { compile } from '@inlang/paraglide-js';
import { assertSafeLaunch } from './guard.mjs';
assertSafeLaunch();
await compile({ project: './.local-dev/project.inlang', outdir: './src/paraglide', outputStructure: 'locale-modules', strategy: ['cookie', 'preferredLanguage', 'baseLocale'], cookieName: 'LOCALE' });
console.log('Offline translations compiled');
