import s from "./components.module.css";
import { makeGuidePlaceholder } from "../lib/placeholder";
import type { GuideLink, SiteId } from "../data/guideLinks";

type CSSVars = React.CSSProperties & { "--accent"?: string };

const SITE_META: Record<SiteId, { label: string; color: string; logo?: string }> = {
  wowhead:  { label: "Wowhead",  color: "#ff3d00",           logo: "/images/guide-sites/wowhead.png" },
  method:   { label: "Method",   color: "#ff8c00",           logo: "/images/guide-sites/method.png" },
  icyveins: { label: "Icy Veins",color: "#7dd3fc",           logo: "/images/guide-sites/icyveins.png" },
  maxroll:  { label: "Maxroll",  color: "rgba(4,122,239,1)", logo: "/images/guide-sites/maxroll.png" },
};

function withBase(url?: string | null): string | null {
  if (!url) return null;
  if (/^(?:https?:|data:)/.test(url)) return url;
  const base = import.meta.env.BASE_URL ?? "/";
  const trimmed = base.endsWith("/") ? base.slice(0, -1) : base;
  const u = url.startsWith("/") ? url : `/${url}`;
  return `${trimmed}${u}`;
}

export function GuideLinkCard({ link }: { link: GuideLink }) {
  const meta = SITE_META[link.site];
  const cover = withBase(meta.logo) ?? makeGuidePlaceholder(meta.label, [link.site]);
  const title = link.title ?? `${meta.label} Guide`;

  // Optional per-site image class like 'logo_wowhead'
  const siteClassKey = `logo_${link.site}` as keyof typeof s;
  const siteImgClass = s[siteClassKey] ?? "";

  const style: CSSVars = { "--accent": meta.color };

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${s.card} ${s.siteCard}`} 
      style={style}
    >
      <img
        src={cover}
        alt={`${meta.label} logo`}
        className={`${s.cardImg} ${siteImgClass}`}
      />
      <div className={s.cardBody}>
        <div className={s.category}>{meta.label}</div>
        <div className={s.cardTitle}>{title}</div>
        <div className={s.meta}>Opens in new tab</div>
      </div>
    </a>
  );
}
