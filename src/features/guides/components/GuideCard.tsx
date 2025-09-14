import page from "../../../styles/page.module.css"
import s from "./components.module.css";
import { Link } from "react-router-dom";
import { makeGuidePlaceholder } from "../lib/placeholder";

export type GuidePost = {
  slug: string;
  imageTitle: string;
  title: string;
  excerpt: string;
  cover?: string;     // now optional
  tags: string[];
  updated: string;
};

export function GuideCard({ post }: { post: GuidePost }) {
  const cover = post.cover || makeGuidePlaceholder(post.imageTitle, post.tags);

  return (
    <li className={`${page.featureCard} ${s.guideCardTight}`}>
      <div className={s.media16x9}>
        {/* decorative cover; omit alt text or use post.title if you prefer */}
        <img className={s.mediaImg} src={cover} alt="" />
      </div>

      <div className={page.cardHeader} style={{ marginTop: 10 }}>
        <span className={page.iconDot} aria-hidden />
        <div>
          <h3 className={page.cardTitle}>{post.title}</h3>
          <p className={`${page.cardSub} ${s.excerptClamp}`}>{post.excerpt}</p>
        </div>
      </div>

      <div className={s.cardFooterRow}>
        <div className={page.pills}>
          {post.tags.map(t => <span key={t} className={page.pill}>{t}</span>)}
        </div>
        <Link to={`/guides/${post.slug}`} className={s.openLink}>Open →</Link>
      </div>

      <div className={page.sectionSubline}>
        Last updated {new Date(post.updated).toLocaleDateString()}
      </div>
    </li>
  );
}
