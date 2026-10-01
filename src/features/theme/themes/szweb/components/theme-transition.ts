import { flushSync } from "react-dom";

type ThemeTransition = {
  ready: Promise<void>;
  finished: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition: () => void;
};
let active: ThemeTransition | undefined;
let revision = 0;
let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

/** Theme-only snapshot dissolve; rapid changes are last-intent-wins. */
export function switchThemeGently(update: () => void) {
  const current = ++revision;
  active?.skipTransition();
  clearTimeout(fallbackTimer);
  const root = document.documentElement;
  root.classList.remove("sz-theme-changing", "sz-theme-fallback");
  let applied = false;
  const apply = () => {
    if (applied || current !== revision) return;
    applied = true;
    flushSync(update);
  };
  const cleanup = () => {
    if (current !== revision) return;
    root.classList.remove("sz-theme-changing", "sz-theme-fallback");
    active = undefined;
  };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    apply();
    return;
  }
  const doc = document as Document & {
    startViewTransition?: (callback: () => void) => ThemeTransition;
  };
  if (!doc.startViewTransition) {
    root.classList.add("sz-theme-fallback");
    // One pre-update style read establishes the fallback's starting colors.
    const surface = document.querySelector(".sz-site");
    if (surface) void getComputedStyle(surface).backgroundColor;
    apply();
    fallbackTimer = setTimeout(cleanup, 360);
    return;
  }
  root.classList.add("sz-theme-changing");
  try {
    active = doc.startViewTransition(apply);
    void active.ready.catch(() => {}); // A skipped snapshot is expected on rapid taps.
    void active.updateCallbackDone.catch(() => apply());
    void active.finished.then(cleanup, cleanup);
  } catch {
    apply();
    cleanup();
  }
}
