import s from "./components.module.css";
import { GuideCard } from "./GuideCard";
import { POSTS } from "../data/posts";

export function GuideGrid() {
  return (
    <div className={s.cardsGrid}>
      {POSTS.map(p => <GuideCard key={p.slug} post={p} />)}
    </div>
  );
}
