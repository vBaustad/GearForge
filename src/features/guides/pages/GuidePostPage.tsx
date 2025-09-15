import page from "../../../styles/page.module.css";
import { Link, useParams } from "react-router-dom";
import { POSTS } from "../data/posts";
import type { GuideBlock, GuidePost } from "../types";
import { makeGuidePlaceholder } from "../lib/placeholder";
import { KEY_ART } from "../data/keyArtManifest";
import { CodeBlock } from "../components/CodeBlock";
import { Callout } from "../components/Callout";
import { QuoteBox } from "../components/QuoteBox";

function withBase(url?: string | null): string | null {
  if (!url) return null;
  if (/^(?:https?:|data:)/.test(url)) return url;
  // Vite provides a typed BASE_URL on import.meta.env
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

export default function GuidePostPage() {
  const { slug } = useParams();
  const post: GuidePost | undefined = POSTS.find(p => p.slug === slug);

  if (!post) {
    return (
      <main className={page.wrap}>
        <div className="featureCard">
          <div className="cardHeader">
            <span className="iconDot" aria-hidden />
            <h3 className="cardTitle">Guide not found</h3>
          </div>
          <p className="navText">We couldn’t find that guide.</p>
          <div className="actions" style={{ marginTop: 10 }}>
            <Link to="/guides" className="ghostBtn">← Back to Guides</Link>
          </div>
        </div>
      </main>
    );
  }

  const picked = (() => {
    if (!Array.isArray(KEY_ART) || KEY_ART.length === 0) return null;
    const idx = hashSeed(post.slug) % KEY_ART.length;
    const url = KEY_ART[idx];
    return url ? encodeURI(url) : null;
  })();
  const cover = withBase(post.cover) || picked || makeGuidePlaceholder(post.imageTitle, post.tags);
  const published = post.published ? new Date(post.published) : null;
  const updated = new Date(post.updated);
  const daysAgo = published ? Math.max(0, Math.round((Date.now() - published.getTime()) / 86400000)) : null;

  return (
    <main className={`${page.wrap} ${page.wrapWide}`}>
      <header className={page.headerRow}>
        <div>
          <h1 className={page.title}>{post.title}</h1>
          <p className={page.subtitle}>
            {published ? (
              <>
                Posted {daysAgo} day{daysAgo === 1 ? "" : "s"} ago{post.author ? <> by <strong>{post.author}</strong></> : null} · Updated {updated.toLocaleDateString()}
              </>
            ) : (
              <>Updated {updated.toLocaleDateString()}</>
            )}
          </p>
          <div className={page.pills} style={{ marginTop: 8 }}>
            {post.tags.map(t => <span key={t} className={page.pill}>{t}</span>)}
          </div>
        </div>
        <Link to="/guides" className="ghostBtn">← All guides</Link>
      </header>

      <section className={page.results}>
        {/* Wide, cropped hero image */}
        <div className={page.guideHero} aria-hidden>
          <img className={page.guideHeroImg} src={cover} alt="" />
        </div>

        {/* Body */}
        <article className="featureCard" style={{ marginTop: 14 }}>
          {renderBlocks(post.content ?? [{ type: "p", text: post.excerpt }])}
        </article>
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
        <figure key={i} className={page.guideImgWrap}>
          <img className={page.guideImg} src={b.src} alt={b.alt || ""} />
          {b.caption ? <figcaption className={page.guideImgCaption}>{b.caption}</figcaption> : null}
        </figure>
      );
    }
    return null;
  });
}
