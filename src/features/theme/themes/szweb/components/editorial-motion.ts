import { useEffect, useRef } from "react";

/** Progressive enhancement: never remount route content or hide server HTML. */
export function useEditorialMotion(pathname: string) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || !pathname) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set<Animation>();
    const play = (element: Element, unfold: boolean, duration: number) => {
      if (media.matches || typeof element.animate !== "function") return;
      const animation = element.animate(
        unfold
          ? [
              { opacity: 0.65, clipPath: "inset(0 1.5% 0 0)" },
              { opacity: 1, clipPath: "inset(0 0 0 0)" },
            ]
          : [{ opacity: 0.65 }, { opacity: 1 }],
        { duration, easing: "cubic-bezier(0.22, 0.68, 0, 1)" },
      );
      animations.add(animation);
      animation.onfinish = () => animations.delete(animation);
    };
    // Transforming the route root would temporarily re-anchor fixed reading UI.
    // Native snapshots handle desktop turns. The fallback never moves fixed UI.
    const nativeTurn =
      typeof document.startViewTransition === "function" &&
      window.matchMedia("(min-width: 851px)").matches;
    const frame = requestAnimationFrame(() => {
      if (!nativeTurn) play(root, false, 200);
    });
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          play(entry.target, true, 320);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.08 },
    );
    root
      .querySelectorAll(".sz-project-band, .sz-home-writing, .sz-project-entry")
      .forEach((element) => {
        if (element.getBoundingClientRect().top > window.innerHeight)
          observer.observe(element);
      });
    const stop = () => {
      if (media.matches) {
        animations.forEach((animation) => animation.cancel());
        animations.clear();
        observer.disconnect();
      }
    };
    media.addEventListener("change", stop);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      media.removeEventListener("change", stop);
      animations.forEach((animation) => animation.cancel());
    };
  }, [pathname]);
  return ref;
}

/** A chapter bookmark; measure only on navigation or actual resizing. */
export function useNavigationIndicator(pathname: string) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = ref.current;
    if (!nav || !pathname) return;
    const update = () => {
      const active = nav.querySelector<HTMLElement>('a[aria-current="page"]');
      nav.style.setProperty("--sz-nav-visible", active ? "1" : "0");
      if (!active) return;
      nav.style.setProperty(
        "--sz-nav-x",
        `${active.offsetLeft + active.offsetWidth / 2 - 4.5}px`,
      );
    };
    const frame = requestAnimationFrame(update);
    const observer = new ResizeObserver(update);
    observer.observe(nav);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [pathname]);
  return ref;
}
