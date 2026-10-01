import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Brand } from "../components/primitives";
import { text as uiText } from "../i18n";

export function NotFoundPage() {
  return (
    <div className="sz-site sz-error-page">
      <div className="sz-wrap">
        <Brand />
        <div className="sz-error-message">
          <p className="sz-label">404</p>
          <h1>{uiText("这一页，走散了。", "This page got away.")}</h1>
          <p>
            {uiText(
              "地址可能已改变。你可以从文章或搜索重新开始。",
              "The address may have changed. Browse the articles or try a search.",
            )}
          </p>
          <div>
            <Link to="/posts" className="sz-button">
              {uiText("浏览文章", "Browse articles")}
              <ArrowLeft size={16} />
            </Link>
            <Link to="/search" className="sz-text-link">
              {uiText("搜索内容", "Search")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
export function ErrorPage() {
  const router = useRouter();
  return (
    <div className="sz-site sz-error-page">
      <div className="sz-wrap">
        <Brand />
        <div className="sz-error-message" role="alert">
          <p className="sz-label">{uiText("暂时无法加载", "Unable to load")}</p>
          <h1>{uiText("稍等，再试一次。", "Take a moment. Try again.")}</h1>
          <p>
            {uiText(
              "内容暂时没有加载完成，请检查连接后重试。",
              "The content could not be loaded. Check your connection and try again.",
            )}
          </p>
          <button
            type="button"
            className="sz-button"
            onClick={() => router.invalidate()}
          >
            {uiText("重新加载", "Try again")}
            <RefreshCw size={15} />
          </button>
          <Link to="/" className="sz-text-link">
            {uiText("返回首页", "Back to home")}
          </Link>
        </div>
      </div>
    </div>
  );
}
