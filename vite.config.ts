import path from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { z } from "zod";
import packageJson from "./package.json";

import { themeNames, themes } from "./src/features/theme/registry";
import { assertSafeLaunch, configPath, persistPath } from "./scripts/local-dev/guard.mjs";

const buildEnvSchema = z.object({
  THEME: z.enum(themeNames).catch("default"),
});

const config = defineConfig(({ mode, command }) => {
  const localDev = command === "serve" || process.env.LOCAL_DEV_ONLY === "szweb-local-v1";
  if (localDev) assertSafeLaunch();
  const env = loadEnv(mode, process.cwd(), "");
  const buildEnv = buildEnvSchema.parse(env);
  return {
    ...(localDev ? { server: { fs: { deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/.dev.vars*", "**/.local-dev/**", "**/.wrangler/**", "**/wrangler.local.jsonc", "**/secrets.json"] }, watch: { ignored: ["**/.local-dev/**", "**/.wrangler/**", "**/scripts/local-dev/**", "**/docs/**", "**/.husky/**"] } } } : {}),
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
      __THEME_NAME__: JSON.stringify(buildEnv.THEME),
      __THEME_CONFIG__: JSON.stringify(themes[buildEnv.THEME]),
    },
    resolve: {
      alias: {
        ...(localDev ? {
          "@/features/ai/ai.service": path.resolve(__dirname, "scripts/local-dev/ai.mock.ts"),
          "worker-mailer": path.resolve(__dirname, "scripts/local-dev/mailer.mock.ts"),
        } : {}),
        "@": path.resolve(__dirname, "./src"),
        "@theme": path.resolve(
          __dirname,
          `src/features/theme/themes/${buildEnv.THEME}`,
        ),
      },
    },
    plugins: [
      paraglideVitePlugin({
        ...(localDev ? { cleanOutdir: false } : {}),
        project: localDev ? "./.local-dev/project.inlang" : "./project.inlang",
        outdir: "./src/paraglide",
        strategy: ["cookie", "preferredLanguage", "baseLocale"],
        cookieName: "LOCALE",
      }),
      cloudflare({
        ...(localDev ? { configPath, persistState: { path: persistPath }, remoteBindings: false, inspectorPort: false } : {}),
        viteEnvironment: {
          name: "ssr",
        },
      }),
      viteTsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
      tailwindcss(),
      ...(!localDev ? [devtools()] : []),
      tanstackStart(),
      viteReact(),
    ],
  };
});

export default config;
