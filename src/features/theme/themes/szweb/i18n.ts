import { getLocale } from "@/paraglide/runtime";

/** Resolve at render time, so SSR follows the current request's locale. */
export const text = (zh: string, en: string) =>
  getLocale() === "en" ? en : zh;
