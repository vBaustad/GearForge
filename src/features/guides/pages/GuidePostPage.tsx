// src/features/guides/pages/GuidePostPage.tsx
import style from "./guidepost.module.css";
import { Link, useParams, useMatches, type UIMatch } from "react-router-dom";
import { POSTS } from "../data/posts";
import type { GuideBlock, GuidePost } from "../types";
import { makeGuidePlaceholder } from "../lib/placeholder";
import { KEY_ART } from "../data/keyArtManifest";
import { CodeBlock } from "../components/CodeBlock";
import { Callout } from "../components/Callout";
import { QuoteBox } from "../components/QuoteBox";
import GoogleAd from "../../../components/ads/GoogleAd";
import { usePageMeta } from "../../../app/seo/usePageMeta";

/* Respect route handles for ad gating (now none on this route) */
type RouteHandle = { noAds?: boolean };
function useAllowAds() {
  const matches = useMatches() as UIMatch<RouteHandle>[];
  const noAdsFromHandle = matches.some(m => (m.handle as RouteHandle)?.noAds);
  return !noAdsFromHandle;
}

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

/** Local block extensions (kept here so we don't have to change shared types) */
type ListBlock = { type: "ol" | "ul" | "steps"; items: string[] }; // "steps" is an alias of "ol"
type TLDRBlock = { type: "tldr"; text: string };
type HRBlock = { type: "hr" };
type GuideBlockEx = GuideBlock | ListBlock | TLDRBlock | HRBlock;

export default function GuidePostPage() {
  const allowAds = useAllowAds();
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
      <section aria-label="Guide" className={style.board}>
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

        <div className={style.boardBody}>
          {/* cover (optional) */}
          {cover ? (
            <div className={style.sectionHero} aria-hidden>
              <div className={style.heroFrame}>
                <img className={style.heroImg} src={cover} alt="" />
              </div>
            </div>
          ) : null}

          <div className={style.section}>
            <article className={`${style.article}`}>
              {renderBlocks(
                (post.content as unknown as GuideBlockEx[]) ??
                  ([{ type: "p", text: post.excerpt }] as GuideBlockEx[])
              )}
            </article>
          </div>

          {allowAds && (
            <div className={style.sectionAd}>
              <div className={style.adFrame}>
                <GoogleAd
                  enabled
                  slot={"0000000061"}         // Guide inline slot 0000000061
                  style={{ minHeight: 250 }}
                  placeholderLabel="Guide inline"
                />
              </div>
            </div>
          )}
        </div>

      </section>
    </main>
  );
}

function StepList({ items, ordered }: { items: string[]; ordered: boolean }) {
  if (ordered) {
    return (
      <ol className={style.olStyled}>
        {items.map((txt, i) => (
          <li key={i}>{txt}</li>
        ))}
      </ol>
    );
  }
  return (
    <ul className={style.ulStyled}>
      {items.map((txt, i) => (
        <li key={i}>{txt}</li>
      ))}
    </ul>
  );
}

function renderBlocks(blocks: GuideBlockEx[]) {
  return blocks.map((b, i) => {
    if (b.type === "p") {
      return (
        <p key={i} className="navText" style={{ margin: i === 0 ? 0 : 8 }}>
          {b.text}
        </p>
      );
    }
    if (b.type === "ol" || b.type === "steps") {
      return <StepList key={i} items={b.items} ordered={true} />;
    }
    if (b.type === "ul") {
      return <StepList key={i} items={b.items} ordered={false} />;
    }
    if (b.type === "tldr") {
      return <Callout key={i} tone="tip" title="TL;DR" text={b.text} />;
    }
    if (b.type === "callout") {
      return <Callout key={i} tone={b.tone} title={b.title} text={b.text} />;
    }
    if (b.type === "quote") {
      return <QuoteBox key={i} source={b.source} originalUrl={b.originalUrl} html={b.html} text={b.text} />;
    }
    if (b.type === "code") {
      return <CodeBlock key={i} label={b.label} lang={b.lang} content={b.content} />;
    }
    if (b.type === "img") {
      return (
        <figure key={i} className={style.guideImgWrap}>
          <img className={style.guideImg} src={b.src} alt={b.alt || ""} />
          {b.caption ? <figcaption className={style.guideImgCaption}>{b.caption}</figcaption> : null}
        </figure>
      );
    }
    if (b.type === "hr") {
      return <hr key={i} style={{ border: "none", borderTop: "1px solid #2a2c31", margin: "14px 0" }} />;
    }
    return null;
  });
}
