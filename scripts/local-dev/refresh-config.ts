import { getPlatformProxy } from "wrangler";
import path from "node:path";
import { assertSafeLaunch, configPath, persistPath } from "./guard.mjs";

assertSafeLaunch();
const proxy = await getPlatformProxy({
  configPath,
  persist: { path: path.join(persistPath, "v3") },
});
try {
  const kv = proxy.env.KV as KVNamespace;
  const before = await kv.get<{site?: {projects?: Array<{image:string}>}}>("system", "json");
  console.log("Previous local cover references:", before?.site?.projects?.map((project) => project.image));
  await kv.delete("system");
  console.log("Local site configuration cache refreshed.");
} finally {
  await proxy.dispose();
}
