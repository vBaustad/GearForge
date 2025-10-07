// src/features/guides/pages/GuidePostPage.tsx
import style from "./guidepost.module.css";
import { Link, useParams } from "react-router-dom";
import { POSTS } from "../data/posts";
import type { GuideBlock, GuidePost } from "../types";
import { makeGuidePlaceholder } from "../lib/placeholder";
import { KEY_ART } from "../data/keyArtManifest";
import { CodeBlock } from "../components/CodeBlock";
import { Callout } from "../components/Callout";
import { QuoteBox } from "../components/QuoteBox";
import { usePageMeta } from "../../../app/seo/usePageMeta";
import type { ReactNode } from "react";

function withBase(url?: string | null): string | null {
  if (!url) return null;
  if (/^(?:https?:|data:)/.test(url)) return url;
  const base = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL) || "/";
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const u = url.startsWith("/") ? url : `/${url}`;
  return `${b}${u}`;
}

function hashSeed(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ---- Type guards / helpers --------------------------------------------------

function isStepsBlock(b: unknown): b is { type: "steps"; items: string[] } {
  if (!b || typeof b !== "object") return false;
  const t = (b as { type?: unknown }).type;
  if (t !== "steps") return false;
  const items = (b as { items?: unknown }).items;
  return Array.isArray(items) && items.every(x => typeof x === "string");
}

function slugifyId(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Tiny inline markup: links, **bold**, _italic_, `code`
function renderInline(text: string): ReactNode {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const linkRe = /\[([^\]]+?)\]\((https?:\/\/[^\s)]+)\)/g;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = linkRe.exec(text))) {
    const [full, label, href] = m;
    if (m.index > last) {
      out.push(formatInline(escape(text.slice(last, m.index))));
    }
    out.push(
      <a key={`${m.index}-${href}`} href={href} target="_blank" rel="nofollow noopener noreferrer">
        {formatInline(escape(label))}
      </a>
    );
    last = m.index + full.length;
  }
  if (last < text.length) {
    out.push(formatInline(escape(text.slice(last))));
  }
  return <>{out}</>;
}

function formatInline(escaped: string): ReactNode {
  type Tok = { t: "text" | "b" | "i" | "code"; v: string };
  const tokens: Tok[] = [{ t: "text", v: escaped }];

  const splitWrap = (re: RegExp, type: Tok["t"]) => {
    const next: Tok[] = [];
    for (const tok of tokens) {
      if (tok.t !== "text") {
        next.push(tok);
        continue;
      }
      let last = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(tok.v))) {
        if (m.index > last) next.push({ t: "text", v: tok.v.slice(last, m.index) });
        next.push({ t: type, v: m[1] });
        last = m.index + m[0].length;
      }
      if (last < tok.v.length) next.push({ t: "text", v: tok.v.slice(last) });
    }
    tokens.splice(0, tokens.length, ...next);
  };

  // order matters
  splitWrap(/`([^`]+?)`/g, "code");
  splitWrap(/\*\*([^*]+?)\*\*/g, "b");
  splitWrap(/_([^_]+?)_/g, "i");

  return (
    <>
      {tokens.map((t, i) => {
        if (t.t === "text") return <span key={i} dangerouslySetInnerHTML={{ __html: t.v }} />;
        if (t.t === "b") return <strong key={i} dangerouslySetInnerHTML={{ __html: t.v }} />;
        if (t.t === "i") return <em key={i} dangerouslySetInnerHTML={{ __html: t.v }} />;
        return <code key={i} className={style.inlineCode} dangerouslySetInnerHTML={{ __html: t.v }} />;
      })}
    </>
  );
}

// ---- Page -------------------------------------------------------------------

export default function GuidePostPage() {
  const { slug } = useParams();
  const post: GuidePost | undefined = POSTS.find(p => p.slug === slug);

  let cover: string | undefined;
  let published: Date | null = null;
  let updated: Date | null = null;
  let daysAgo: number | null = null;

  if (post) {
    const picked = (() => {
      if (!Array.isArray(KEY_ART) || KEY_ART.length === 0) return null;
      const idx = hashSeed(post.slug) % KEY_ART.length;
      const url = KEY_ART[idx];
      return url ? encodeURI(url) : null;
    })();

    const resolved = withBase(post.cover) || picked || makeGuidePlaceholder(post.imageTitle, post.tags);
    cover = resolved || undefined;

    published = post.published ? new Date(post.published) : null;
    updated = new Date(post.updated);
    daysAgo = published ? Math.max(0, Math.round((Date.now() - published.getTime()) / 86400000)) : null;
  } else {
    updated = new Date();
  }

  usePageMeta({
    title: post?.title ?? "Guide not found",
    description: post?.excerpt ?? "We couldn’t find that guide.",
    canonical: `/guides/${slug}`,
    image: cover,
    ogType: post ? "article" : "website",
    noindex: !post,
  });

  if (!post) {
    return (
      <main className={`${style.wrap} ${style.wrapWide}`}>
        <section className={style.board}>
          <div className={style.boardBody}>
            <div className={style.section}>
              <div className={style.innerCard}>
                <div className={style.cardHeadRow}>
                  <div className={style.iconDot} aria-hidden />
                  <h3 className={style.cardTitle}>Guide not found</h3>
                </div>
                <p className={style.dim}>We couldn’t find that guide.</p>
                <div className={style.actions} style={{ marginTop: 10 }}>
                  <Link to="/guides" className={style.ghostBtn}>
                    ← Back to Guides
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const blocks: GuideBlock[] = post.content ?? [];

  return (
    <main className={`${style.wrap} ${style.wrapWide}`}>
      <section aria-label="Guide" className={style.board}>
        <div className={style.introRow}>
          <div className={style.introCopy}>
            <h1 className={style.introTitle}>{post.title}</h1>
            <p className={style.introSubtitle}>
              {published ? (
                <>
                  Posted {daysAgo} day{daysAgo === 1 ? "" : "s"} ago
                  {post.author ? <> by <strong>{post.author}</strong></> : null}
                  {" · "}Updated {updated!.toLocaleDateString()}
                </>
              ) : (
                <>Updated {updated!.toLocaleDateString()}</>
              )}
            </p>
            {post.tags?.length ? (
              <div className={style.pills} aria-label="Tags">
                {post.tags.map(t => (
                  <span key={t} className={style.pill}>
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <Link to="/guides" className={style.ghostBtn} aria-label="Back to all guides">
            ← All guides
          </Link>
        </div>

        <div className={style.boardBody}>
          {/* Optional cover */}
          {cover ? (
            <div className={style.sectionHero} aria-hidden>
              <div className={style.heroFrame}>
                <img className={style.heroImg} src={cover} alt="" />
              </div>
            </div>
          ) : null}

          {/* Article */}
          <div className={style.section}>
            <article className={style.article}>
              {renderBlocks(blocks.length ? blocks : [{ type: "p", text: post.excerpt }])}
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}

// ---- Renderers --------------------------------------------------------------

function StepList({ items, ordered }: { items: string[]; ordered: boolean }) {
  if (ordered) {
    return (
      <ol className={style.olStyled}>
        {items.map((txt, i) => (
          <li key={i}>{renderInline(txt)}</li>
        ))}
      </ol>
    );
  }
  return (
    <ul className={style.ulStyled}>
      {items.map((txt, i) => (
        <li key={i}>{renderInline(txt)}</li>
      ))}
    </ul>
  );
}

function renderBlocks(blocks: GuideBlock[]) {
  return blocks.map((b, i) => {
    // Paragraph
    if (b.type === "p") {
      return (
        <p key={i} className="navText" style={{ margin: i === 0 ? 0 : 8 }}>
          {renderInline(b.text)}
        </p>
      );
    }

    // Headings
    if (b.type === "h2" || b.type === "h3" || b.type === "h4") {
      const id = b.id ?? slugifyId(b.text);
      if (b.type === "h2") return <h2 key={i} id={id} className={style.h2}>{b.text}</h2>;
      if (b.type === "h3") return <h3 key={i} id={id} className={style.h3}>{b.text}</h3>;
      return <h4 key={i} id={id} className={style.h4}>{b.text}</h4>;
    }

    // Lists
    if (b.type === "ol") return <StepList key={i} items={b.items} ordered={true} />;
    if (b.type === "ul") return <StepList key={i} items={b.items} ordered={false} />;

    // Back-compat: "steps" alias for ordered lists (not in the public type)
    if (isStepsBlock(b)) {
      return <StepList key={i} items={b.items} ordered={true} />;
    }

    // Callouts / TL;DR  (render inline so **bold** / _italic_ / `code` work)
    if (b.type === "tldr") {
      return (
        <Callout key={i} tone="tip" title="TL;DR">
          {renderInline(b.text)}
        </Callout>
      );
    }
    if (b.type === "callout") {
      return (
        <Callout key={i} tone={b.tone} title={b.title}>
          {renderInline(b.text)}
        </Callout>
      );
    }

    // Quote
    if (b.type === "quote") {
      return <QuoteBox key={i} source={b.source} originalUrl={b.originalUrl} html={b.html} text={b.text} />;
    }

    // Code
    if (b.type === "code") {
      return <CodeBlock key={i} label={b.label} lang={b.lang} content={b.content} />;
    }

    if (b.type === "img") {
      const src = withBase(b.src) ?? b.src;
      return (
        <figure key={i} className={style.guideImgWrap}>
          <div className={style.guideImgFrame}>
            <img
              className={style.guideImg}
              src={src}
              alt={b.alt || ""}
              loading="lazy"
              decoding="async"
            />
          </div>
          {b.caption ? (
            <figcaption className={style.guideImgCaption}>{b.caption}</figcaption>
          ) : null}
        </figure>
      );
    }


    // Divider
    if (b.type === "hr") {
      return <hr key={i} style={{ border: "none", borderTop: "1px solid #2a2c31", margin: "14px 0" }} />;
    }

    return null;
  });
}
