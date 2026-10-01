import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import theme from "@theme";
import { NotFound } from "@/components/common/not-found";
import type { ThemeComponents } from "@/features/theme/contract/components";
import {
  foldChapter,
  foldChapters,
} from "@/features/theme/themes/szweb/components/fold-navigation";
import { ErrorPage } from "./components/common/error-page";
import * as TanstackQuery from "./integrations/tanstack-query/root-provider";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
export function getRouter() {
  const rqContext = TanstackQuery.getContext();
  const ThemeNotFound = (theme as ThemeComponents).NotFoundPage ?? NotFound;
  const ThemeError = (theme as ThemeComponents).ErrorPage ?? ErrorPage;

  const router = createRouter({
    routeTree,
    context: { ...rqContext },
    defaultPreload: "intent",
    Wrap: (props: { children: React.ReactNode }) => {
      return (
        <TanstackQuery.Provider {...rqContext}>
          {props.children}
        </TanstackQuery.Provider>
      );
    },
    defaultNotFoundComponent: () => <ThemeNotFound />,
    defaultErrorComponent: ({ error }) => <ThemeError error={error} />,
    defaultViewTransition: __THEME_CONFIG__.viewTransition,
    scrollRestoration: true,
  });

  if (__THEME_NAME__ === "szweb" && typeof window !== "undefined") {
    const chapters: readonly string[] = foldChapters.map(({ to }) => to);
    const chapter = (path: string) => chapters.indexOf(foldChapter(path) ?? "");
    const isPublic = (path: string) =>
      !/^\/(admin|login|register|forgot-password|reset-link|verify-email|profile|submit-friend-link|oauth)(\/|$)/.test(
        path,
      );
    const motion = window.matchMedia(
      "(min-width: 851px) and (prefers-reduced-motion: no-preference)",
    );
    let previousPathname = window.location.pathname;
    const updateMotion = () =>
      router.update({
        ...router.options,
        defaultViewTransition: motion.matches,
      });
    updateMotion();
    motion.addEventListener("change", updateMotion);
    router.subscribe("onResolved", ({ toLocation }) => {
      previousPathname = toLocation.pathname;
    });
    router.subscribe("onBeforeLoad", ({ fromLocation, toLocation }) => {
      const from = fromLocation?.pathname ?? previousPathname;
      router.update({
        ...router.options,
        defaultViewTransition:
          motion.matches &&
          from !== toLocation.pathname &&
          isPublic(from) &&
          isPublic(toLocation.pathname),
      });
      document.documentElement.dataset.szTurn =
        chapter(toLocation.pathname) < chapter(from) ? "back" : "forward";
    });
  }

  setupRouterSsrQueryIntegration({
    router,
    queryClient: rqContext.queryClient,
  });

  return router;
}
