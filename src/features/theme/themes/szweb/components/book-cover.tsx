import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Rss } from "lucide-react";
import { useId } from "react";
import { text } from "../i18n";
import { useSite } from "./primitives";

/** Keep the site's editable statement; only its typesetting changes. */
function Statement({ title }: { title: string }) {
  const comma = title.indexOf("，");
  const opening = comma >= 0 ? title.slice(0, comma + 1) : "";
  const closing = comma >= 0 ? title.slice(comma + 1) : title;
  const accent = closing.indexOf("成形");
  return (
    <>
      {opening && <span className="sz-cover-opening">{opening}</span>}
      <span className="sz-cover-closing">
        {accent >= 0 ? (
          <>
            {closing.slice(0, accent)}
            <span className="sz-cover-brush">成形</span>
            <span className="sz-cover-punctuation">
              {closing.slice(accent + 2)}
            </span>
          </>
        ) : (
          closing
        )}
      </span>
    </>
  );
}

function PaperArtwork({ author }: { author: string }) {
  const id = useId().replaceAll(":", "");
  return (
    <svg
      className="sz-cover-art"
      viewBox="0 0 520 500"
      width="520"
      height="500"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter
          id={`${id}-shadow`}
          x="-30%"
          y="-30%"
          width="170%"
          height="170%"
        >
          <feDropShadow
            dx="3"
            dy="12"
            stdDeviation="9"
            floodColor="#171717"
            floodOpacity="0.14"
          />
        </filter>
        <linearGradient id={`${id}-face`} x1="0" y1="0" x2="1" y2="1">
          <stop className="sz-cover-face-light" offset="0" />
          <stop className="sz-cover-face-shade" offset="1" />
        </linearGradient>
        <linearGradient id={`${id}-curl`} x1="0.1" y1="0.1" x2="0.9" y2="1">
          <stop offset="0" stopColor="#eeeeee" />
          <stop offset="0.46" stopColor="#bdbdbd" />
          <stop offset="1" stopColor="#858585" />
        </linearGradient>
      </defs>
      <g className="sz-cover-composition">
        <g className="sz-cover-leaf sz-cover-leaf--back">
          <path d="M91 94 L408 81 Q413 81 413 86 L438 414 Q438 419 433 419 L117 431 Q112 431 112 426 L86 100 Q86 95 91 94Z" />
        </g>
        <g className="sz-cover-leaf sz-cover-leaf--under">
          <path d="M94 79 L414 73 Q419 73 419 78 L433 402 Q433 407 428 407 L110 413 Q105 413 105 408 L89 85 Q89 80 94 79Z" />
          <path
            className="sz-cover-under-edge"
            d="M419 78 L433 402 Q433 407 428 407 L110 413"
          />
        </g>
        <g
          className="sz-cover-leaf sz-cover-leaf--front"
          filter={`url(#${id}-shadow)`}
        >
          <path
            className="sz-cover-paper-face"
            fill={`url(#${id}-face)`}
            d="M101 60 H420 Q425 60 425 65 V288 C414 331 387 365 344 390 H101 Q96 390 96 385 V65 Q96 60 101 60Z"
          />
          <text className="sz-cover-paper-label" x="122" y="97">
            {author.slice(0, 24).toUpperCase()} / JOURNAL
          </text>
          <text
            className="sz-cover-paper-number"
            x="391"
            y="97"
            textAnchor="end"
          >
            01
          </text>
          <path className="sz-cover-paper-rule" d="M122 113 H395" />
          <text className="sz-cover-paper-glyph" x="143" y="313">
            折
          </text>
          <path
            className="sz-cover-paper-rule"
            d="M122 347 C172 341 228 350 281 341"
          />
          <text className="sz-cover-paper-label" x="122" y="370">
            THOUGHTS, TAKING SHAPE.
          </text>
          <g className="sz-cover-curl">
            <path
              className="sz-cover-curl-shadow"
              d="M425 288 C399 318 375 325 345 309 C363 343 365 369 344 390 C386 366 414 333 425 288Z"
            />
            <path
              fill={`url(#${id}-curl)`}
              d="M425 288 C399 318 376 321 349 304 C369 340 365 369 344 390 C391 365 414 332 425 288Z"
            />
            <path
              className="sz-cover-curl-crease"
              d="M349 304 C376 321 399 318 425 288"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}

export function BookCover({ about = false }: { about?: boolean }) {
  const site = useSite();
  const title = site.welcome?.title || site.title;
  return (
    <section className={`sz-book-cover${about ? " sz-book-cover--about" : ""}`}>
      <div className="sz-cover-topline">
        <p className="sz-cover-eyebrow">
          {about
            ? text("关于 / ABOUT THIS BLOG", "ABOUT THIS BLOG")
            : text("个人博客 / A PERSONAL BLOG", "A PERSONAL BLOG")}
        </p>
        {about ? (
          <span className="sz-cover-author">{site.author}</span>
        ) : (
          <a href="/rss.xml" className="sz-text-link">
            RSS <Rss size={14} />
          </a>
        )}
      </div>
      <div className="sz-cover-body">
        <div className="sz-cover-copy">
          {about ? (
            <>
              <h1 className="sz-cover-title sz-cover-title--name">
                <span className="sz-cover-opening">
                  {text("这是我的个人博客", "My personal blog, ")}
                </span>
                <span className="sz-cover-brush">{site.title}</span>
                <span className="sz-cover-punctuation">{text("。", ".")}</span>
              </h1>
              <p className="sz-cover-description sz-cover-description--statement">
                {title}
              </p>
              <p className="sz-cover-identity">
                {text(
                  `${site.author} 的个人博客，记录技术、生活与创作。`,
                  `${site.author}'s personal blog on technology, life and making.`,
                )}
              </p>
            </>
          ) : (
            <>
              <h1 className="sz-cover-title">
                <Statement title={title} />
              </h1>
              <p className="sz-cover-description">
                <span className="sz-cover-identity">
                  {text(
                    `${site.author} 的个人博客。`,
                    `${site.author}'s personal blog.`,
                  )}
                </span>{" "}
                {site.welcome?.description || site.description}
              </p>
              <nav
                className="sz-cover-actions"
                aria-label={text("从这里开始", "Start here")}
              >
                <Link to="/directory" className="sz-text-link">
                  {text("站点索引", "Journal contents")}
                  <ArrowRight size={16} />
                </Link>
                <Link to="/projects" className="sz-text-link">
                  {text("看看作品", "Explore the work")}
                  <ArrowUpRight size={16} />
                </Link>
              </nav>
            </>
          )}
        </div>
        <Link
          to="/posts"
          className="sz-cover-object"
          aria-label={text(
            "从文字开始，翻阅全部文章",
            "Start with writing, browse all articles",
          )}
        >
          <PaperArtwork author={site.author || site.title} />
          <span className="sz-cover-object-note">
            <span>{text("从文字开始", "Start with writing")}</span>
            <ArrowRight size={17} />
          </span>
        </Link>
      </div>
      <div className="sz-cover-footline">
        {about ? (
          <span>
            {text(
              "文字与作品，互相照应。",
              "Writing and work, in conversation.",
            )}
          </span>
        ) : (
          <Link to="/about">
            {site.author}
            <span>{text("写作、生活与创作", "Writing, life and making")}</span>
          </Link>
        )}
        <span className="sz-cover-imprint">
          {text("未完，待续", "Always unfolding")}
        </span>
      </div>
    </section>
  );
}
