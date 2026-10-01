import { Link, useLocation } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowUp,
  ArrowUpRight,
  Menu,
  Moon,
  Search,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/common/theme-provider";
import type {
  AuthLayoutProps,
  PublicLayoutProps,
  UserLayoutProps,
} from "@/features/theme/contract/layouts";
import { getLocale, setLocale } from "@/paraglide/runtime";
import {
  useEditorialMotion,
  useNavigationIndicator,
} from "../components/editorial-motion";
import {
  foldChapter,
  foldChapters as links,
} from "../components/fold-navigation";
import { Brand, useSite } from "../components/primitives";
import { QuickSearchProvider, SearchTrigger } from "../components/quick-search";
import { switchThemeGently } from "../components/theme-transition";
import { text as uiText } from "../i18n";

function Appearance() {
  const { setTheme, userTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <details className="sz-appearance">
      <summary
        className="sz-icon-button"
        aria-label={uiText("阅读与外观", "Reading and appearance")}
        title={uiText("阅读与外观", "Reading and appearance")}
      >
        <span className="sz-theme-icon" aria-hidden="true">
          <Sun size={18} className="sz-theme-sun" />
          <Moon size={18} className="sz-theme-moon" />
        </span>
      </summary>
      <div className="sz-popover">
        <p className="sz-label">{uiText("外观", "Appearance")}</p>
        {(["light", "dark", "system"] as const).map((mode, i) => (
          <button
            key={mode}
            type="button"
            aria-pressed={mounted && userTheme === mode}
            onClick={() => switchThemeGently(() => setTheme(mode))}
          >
            {
              [
                uiText("浅色", "Light"),
                uiText("深色", "Dark"),
                uiText("跟随系统", "System"),
              ][i]
            }
            {mounted && userTheme === mode && <span aria-hidden="true">·</span>}
          </button>
        ))}
        <label className="sz-locale">
          {uiText("语言 / Language", "Language")}
          <select
            aria-label={uiText("语言 / Language", "Language")}
            value={getLocale()}
            onChange={(event) => setLocale(event.target.value as "zh" | "en")}
          >
            <option value="zh">{uiText("中文", "中文")}</option>
            <option value="en">English</option>
          </select>
        </label>
      </div>
    </details>
  );
}
function Header({
  user,
  isSessionLoading,
  logout,
}: Pick<PublicLayoutProps, "user" | "isSessionLoading" | "logout">) {
  const location = useLocation();
  const navigationRef = useNavigationIndicator(location.pathname);
  const dialog = useRef<HTMLDialogElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const en = getLocale() === "en";
  const close = () => {
    dialog.current?.close();
    setMenuOpen(false);
  };
  useEffect(() => {
    close();
    document
      .querySelectorAll<HTMLDetailsElement>(".sz-header details")
      .forEach((el) => {
        el.open = false;
      });
  }, [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);
  const account = (
    <>
      {user ? (
        <>
          <p className="sz-account-name">{user.name}</p>
          <Link to="/profile">{uiText("个人资料", "Profile")}</Link>
          <Link to="/submit-friend-link">
            {uiText("申请友链", "Submit a site")}
          </Link>
          {user.role === "admin" && (
            <Link to="/admin">
              {uiText("管理后台", "Admin")}
              <ArrowUpRight size={14} />
            </Link>
          )}
          <button
            type="button"
            onClick={async () => {
              await logout();
              close();
            }}
          >
            {uiText("退出登录", "Sign out")}
          </button>
        </>
      ) : (
        <>
          <Link to="/login">{uiText("登录", "Sign in")}</Link>
          <Link to="/register">{uiText("注册账户", "Create account")}</Link>
        </>
      )}
    </>
  );
  return (
    <>
      <header className="sz-header">
        <div className="sz-wrap sz-header-inner">
          <Brand unfold={location.pathname === "/"} />
          <nav
            className="sz-desktop-nav"
            ref={navigationRef}
            aria-label={uiText("主导航", "Main navigation")}
          >
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                aria-current={
                  foldChapter(location.pathname) === link.to
                    ? "page"
                    : undefined
                }
              >
                <span className="sz-nav-label">
                  {en ? link.en : link.title}
                </span>
              </Link>
            ))}
            <span className="sz-nav-indicator" aria-hidden="true" />
          </nav>
          <div className="sz-header-actions">
            <SearchTrigger />
            <div className="sz-desktop-appearance">
              <Appearance />
            </div>
            <details className="sz-account">
              <summary
                className="sz-icon-button"
                aria-label={
                  user
                    ? uiText("账户菜单", "Account menu")
                    : uiText("登录与账户", "Sign in and account")
                }
              >
                <UserRound size={17} />
              </summary>
              <div className="sz-popover" aria-busy={isSessionLoading}>
                {account}
              </div>
            </details>
            <button
              type="button"
              className="sz-icon-button sz-menu-toggle"
              aria-label={uiText("打开导航菜单", "Open navigation")}
              aria-expanded={menuOpen}
              aria-controls="sz-mobile-menu"
              ref={toggle}
              onClick={() => {
                dialog.current?.showModal();
                setMenuOpen(true);
              }}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>
      <dialog
        className="sz-mobile-menu"
        id="sz-mobile-menu"
        ref={dialog}
        onClose={() => {
          setMenuOpen(false);
          toggle.current?.focus();
        }}
        aria-label={uiText("主导航", "Main navigation")}
      >
        <div className="sz-menu-top">
          <Brand />
          <button
            type="button"
            className="sz-icon-button"
            aria-label={uiText("关闭导航菜单", "Close navigation")}
            onClick={close}
          >
            <X size={22} />
          </button>
        </div>
        <Link to="/search" className="sz-menu-search" onClick={close}>
          {uiText(
            "搜索文章、主题或一个想法",
            "Search an article, topic or idea",
          )}
          <Search size={18} />
        </Link>
        <nav aria-label={uiText("手机导航", "Mobile navigation")}>
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={close}
              aria-current={
                foldChapter(location.pathname) === link.to ? "page" : undefined
              }
            >
              {en ? link.en : link.title}
              <span>{link.en}</span>
            </Link>
          ))}
        </nav>
        <div className="sz-menu-account">{account}</div>
        <div className="sz-menu-bottom">
          <Link to="/tags" onClick={close}>
            {uiText("主题", "Topics")}
          </Link>
          <Link to="/friend-links" onClick={close}>
            {uiText("友链", "Friends")}
          </Link>
          <a href="/rss.xml">RSS</a>
          <Appearance />
        </div>
      </dialog>
    </>
  );
}
function Footer() {
  const site = useSite();
  return (
    <footer className="sz-footer">
      <div className="sz-wrap">
        <div className="sz-footer-main">
          <div>
            <span className="sz-footer-label">
              {uiText("封底 / COLOPHON", "Colophon")}
            </span>
            <Brand />
            <p>{site.welcome?.description ?? site.description}</p>
          </div>
          <nav aria-label={uiText("页脚导航", "Footer navigation")}>
            <Link to="/directory" className="sz-footer-index">
              <span>{uiText("站点索引", "Site index")}</span>
              <ArrowUpRight size={22} aria-hidden="true" />
            </Link>
            <div className="sz-footer-links">
              <Link to="/posts">{uiText("全部文章", "All articles")}</Link>
              <Link to="/projects">{uiText("全部项目", "All projects")}</Link>
              <Link to="/archive">{uiText("时间档案", "Archive")}</Link>
              <Link to="/friend-links">{uiText("友链", "Friends")}</Link>
              <a href="/rss.xml">{uiText("RSS 订阅", "Subscribe via RSS")}</a>
              <Link to="/about">{uiText("关于作者", "About the author")}</Link>
            </div>
          </nav>
        </div>
        <div className="sz-footer-bottom">
          <span>
            © {new Date().getUTCFullYear()} {site.title}{" "}
            <span className="sz-footer-credit">
              / Powered by{" "}
              <a
                href="https://github.com/du2333/flare-stack-blog"
                target="_blank"
                rel="noreferrer"
              >
                Flare Stack Blog
              </a>
            </span>
          </span>
          <button
            type="button"
            className="sz-text-link"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? "instant"
                  : "smooth",
              })
            }
          >
            {uiText("回到顶部", "Back to top")}
            <ArrowUp size={13} />
          </button>
        </div>
      </div>
    </footer>
  );
}
export function PublicLayout({ children, ...props }: PublicLayoutProps) {
  const { pathname } = useLocation();
  const mainRef = useEditorialMotion(pathname);
  return (
    <QuickSearchProvider>
      <div className="sz-site">
        <a className="sz-skip" href="#sz-main">
          {uiText("跳转至主要内容", "Skip to main content")}
        </a>
        <Header {...props} />
        <main id="sz-main" className="sz-main" tabIndex={-1} ref={mainRef}>
          {children}
        </main>
        <Footer />
      </div>
    </QuickSearchProvider>
  );
}
export function UserLayout({ children, ...props }: UserLayoutProps) {
  return (
    <PublicLayout {...props}>
      {props.isAuthenticated ? (
        children
      ) : (
        <div className="sz-wrap sz-empty">
          <h1>{uiText("登录后，继续。", "Sign in to continue.")}</h1>
          <p>
            {uiText(
              "管理个人资料，或提交你的网站。",
              "Manage your profile or submit your website.",
            )}
          </p>
          <Link to="/login" className="sz-button">
            {uiText("登录账户", "Sign in")}
          </Link>
        </div>
      )}
    </PublicLayout>
  );
}
export function AuthLayout({ onBack, children }: AuthLayoutProps) {
  return (
    <QuickSearchProvider>
      <div className="sz-site sz-auth-site">
        <a className="sz-skip" href="#sz-main">
          {uiText("跳转至主要内容", "Skip to main content")}
        </a>
        <header className="sz-wrap sz-auth-header">
          <Brand />
          <Appearance />
        </header>
        <main id="sz-main" className="sz-wrap sz-auth-main">
          <button
            type="button"
            className="sz-text-link sz-auth-back"
            onClick={onBack}
          >
            <ArrowLeft size={15} />
            {uiText("返回浏览", "Back to reading")}
          </button>
          {children}
        </main>
        <div className="sz-wrap sz-auth-footer">
          <Link to="/">{uiText("首页", "Home")}</Link>
          <Link to="/friend-links">{uiText("友链", "Friends")}</Link>
          <a href="/rss.xml">RSS</a>
        </div>
      </div>
    </QuickSearchProvider>
  );
}
