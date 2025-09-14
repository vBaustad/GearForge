import s from "./components.module.css";
import { GuideCard, type GuidePost } from "./GuideCard";

const POSTS: GuidePost[] = [
  {
    slug: "reduce-spell-clutter",
    imageTitle: "Improve Performance",
    title: "Reduce spell clutter in big pulls",
    excerpt: "Simple client toggles that cut visual noise without touching DPS. Great for raid trash and AoE weeks.",
    cover: "",
    tags: ["ui","performance","m+"],
    updated: "2025-09-12",
  },
  {
    slug: "cloak-upgrade-macro",
    imageTitle: "Remote Cloak Upgrade",
    title: "One-click cloak upgrade macro",
    excerpt: "Applies the next valid upgrade and stops safely if you’re missing crests or gold.",
    cover: "",
    tags: ["macro","upgrades"],
    updated: "2025-09-12",
  },
  {
    slug: "weekly-world-quest-advantage",
    imageTitle: "WQ Advantage!",
    title: "Do this week’s world quest for a later advantage",
    excerpt: "Quick objective now; early crest income and rep to unlock cheaper upgrades later.",
    cover: "",
    tags: ["weekly","quest"],
    updated: "2025-09-12",
  },
];

export function GuideGrid() {
  return (
    <ul className={s.cardsGrid3}>
      {POSTS.map(p => <GuideCard key={p.slug} post={p} />)}
    </ul>
  );
}
