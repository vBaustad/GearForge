import s from "./components.module.css";

export function Callout({ tone = "tip", title, text }: { tone?: "tip" | "warning"; title?: string; text: string }) {
  const toneClass = tone === "warning" ? s.calloutWarn : s.calloutTip;
  return (
    <div className={`${s.callout} ${toneClass}`}>
      {title ? <div className={s.calloutTitle}>{title}</div> : null}
      <p className="navText" style={{ margin: 0 }}>{text}</p>
    </div>
  );
}
