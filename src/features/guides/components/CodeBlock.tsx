import { useState } from "react";
import s from "./components.module.css";

export function CodeBlock({ label, lang, content }: { label?: string; lang?: string; content: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className={s.codeWrap}>
      <div className={s.codeHead}>
        <div className={s.codeLabel}>{label || (lang ? lang.toUpperCase() : "Code")}</div>
        <button type="button" className={s.copyBtn} onClick={onCopy}>{copied ? "Copied" : "Copy"}</button>
      </div>
      <pre className={s.codePre} data-lang={lang}><code>{content}</code></pre>
    </div>
  );
}
