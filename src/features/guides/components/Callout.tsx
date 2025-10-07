import { type ReactNode } from "react";
import s from "./components.module.css";

type CalloutTone = "tip" | "warning" | "info" | "success";

export function Callout({
  tone = "tip",
  title,
  text,
  children,
}: {
  tone?: CalloutTone;
  title?: string;
  text?: string;
  children?: ReactNode;
}) {
  const toneClass =
    tone === "warning" ? s.calloutWarn
    : tone === "info"  ? s.calloutInfo
    : tone === "success" ? s.calloutSuccess
    : s.calloutTip;

  const role =
    tone === "warning" ? "alert"
    : tone === "info" || tone === "success" ? "status"
    : undefined;

  return (
    <div className={`${s.callout} ${toneClass}`} role={role}>
      {title ? <div className={s.calloutTitle}>{title}</div> : null}
      <p className="navText" style={{ margin: 0 }}>
        {children ?? text /* if you still pass plain text */}
      </p>
    </div>
  );
}
