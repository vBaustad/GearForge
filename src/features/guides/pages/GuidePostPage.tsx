import style from "./guidepost.module.css";
import { Link, useParams } from "react-router-dom";
import { POSTS } from "../data/posts";
import type { GuideBlock, GuidePost } from "../types";
import { makeGuidePlaceholder } from "../lib/placeholder";
import { KEY_ART } from "../data/keyArtManifest";
import { CodeBlock } from "../components/CodeBlock";
import { Callout } from "../components/Callout";
import { QuoteBox } from "../components/QuoteBox";
import { GoogleAd } from "../../../components/ads/GoogleAd";
import { AD_SLOTS } from "../../../config/ads";
import { usePageMeta } from "../../../app/seo/usePageMeta";

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
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export default function GuidePostPage() {
  const { slug } = useParams();
  const post: GuidePost | undefined = POSTS.find(p => p.slug === slug);

 // ---- derive values safely (post may be undefined) ----
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

  // ---- call the hook once, unconditionally ----
  usePageMeta({
    title: post?.title ?? "Guide not found",
    description: post?.excerpt ?? "We couldn’t find that guide.",
    canonical: `/guides/${slug}`,
    image: cover,
    ogType: post ? "article" : "website",
    noindex: !post, // keep 404s out of search
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
                  <Link to="/guides" className={style.ghostBtn}>← Back to Guides</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={`${style.wrap} ${style.wrapWide}`}>
      {/* One continuous board: header + content */}
      <section aria-label="Guide" className={style.board}>
        {/* Intro row inside the same surface */}
        <div className={style.introRow}>
          <div className={style.introCopy}>
            <h1 className={style.introTitle}>{post.title}</h1>
            <p className={style.introSubtitle}>
              {published ? (
                <>
                  Posted {daysAgo} day{daysAgo === 1 ? "" : "s"} ago
                  {post.author ? <> by <strong>{post.author}</strong></> : null}
                  {" · "}Updated {updated.toLocaleDateString()}
                </>
              ) : (
                <>Updated {updated.toLocaleDateString()}</>
              )}
            </p>

            {post.tags?.length ? (
              <div className={style.pills} aria-label="Tags">
                {post.tags.map(t => <span key={t} className={style.pill}>{t}</span>)}
              </div>
            ) : null}
          </div>

          <Link to="/guides" className={style.ghostBtn} aria-label="Back to all guides">
            ← All guides
          </Link>
        </div>

        {/* Body sections */}
        <div className={style.boardBody}>
          {/* Ad near top */}
          <div className={style.sectionAd}>
            <div className={style.adFrame}>
              <GoogleAd
                slot={AD_SLOTS.guideArticleTop}
                style={{ minHeight: 120 }}
                placeholderLabel="Guide top"
              />
            </div>
          </div>

          {/* Full-bleed hero inside the board */}
          {cover ? (
            <div className={style.sectionHero} aria-hidden>
              <div className={style.heroFrame}>
                <img className={style.heroImg} src={cover} alt="" />
              </div>
            </div>
          ) : null}

          {/* Inline ad */}
          <div className={style.sectionAd}>
            <div className={style.adFrame}>
              <GoogleAd
                slot={AD_SLOTS.guideArticleInline}
                style={{ minHeight: 250 }}
                placeholderLabel="Guide inline"
              />
            </div>
          </div>

          {/* Article content as an inner card */}
          <div className={style.section}>
            <article className={style.innerCard}>
              {renderBlocks(post.content ?? [{ type: "p", text: post.excerpt }])}
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}

function renderBlocks(blocks: GuideBlock[]) {
  return blocks.map((b, i) => {
    if (b.type === "p") return <p key={i} className="navText" style={{ margin: i === 0 ? 0 : 8 }}>{b.text}</p>;
    if (b.type === "code") return <CodeBlock key={i} label={b.label} lang={b.lang} content={b.content} />;
    if (b.type === "callout") return <Callout key={i} tone={b.tone} title={b.title} text={b.text} />;
    if (b.type === "quote") return <QuoteBox key={i} source={b.source} originalUrl={b.originalUrl} html={b.html} text={b.text} />;
    if (b.type === "img") {
      return (
        <figure key={i} className={style.guideImgWrap}>
          <img className={style.guideImg} src={b.src} alt={b.alt || ""} />
          {b.caption ? <figcaption className={style.guideImgCaption}>{b.caption}</figcaption> : null}
        </figure>
      );
    }
    return null;
  });
}
