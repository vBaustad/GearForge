import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import type { Post, ChangeBlock, ChangeType } from "../types";
import { POSTS } from "../data/posts";
import s from "./components.module.css";

function TypeBadge({ t }: { t: ChangeType | string }) {
  const norm = String(t).toLowerCase() as ChangeType;
  const isType = ["new","fix","improve","data","note","breaking"].includes(norm);
  const key = isType ? `badge_${norm}` : "badge_custom";
  const label = isType
    ? { new:"New", fix:"Fix", improve:"Improve", data:"Data", note:"Note", breaking:"Breaking" }[norm]
    : String(t);
  return <span className={`${s.badge} ${s[key]}`}>{label}</span>;
}

function Block({ b }: { b: ChangeBlock }) {
  if (b.kind === "paragraph") return <p className={s.textParagraph}>{b.text}</p>;
  if (b.kind === "code")      return <pre className={s.code}><code>{b.code}</code></pre>;

  const rawLabel = b.label ? String(b.label).toLowerCase() : "";
  const isForceList = rawLabel === "list" || rawLabel === "bullets" || rawLabel === "plain";
  const hasLabel = !!b.label && !isForceList;

  if (isForceList) {
    return (
      <section className={s.section}>
        <div className={s.sectionFrame}>
          {b.title && <h3 className={`${s.h3} ${s.h3Tight}`}>{b.title}</h3>}
          <ul className={s.bullets}>
            {b.items.map((it, i) => (
              <li key={i}>
                <span className={s.bulletText}>{it.text}</span>
                {it.subitems?.length ? <ul className={s.subBullets}>{it.subitems.map((t,k)=><li key={k}>{t}</li>)}</ul> : null}
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  if (hasLabel) {
    return (
      <section className={s.section}>
        <div className={s.sectionFrame}>
          {(b.title || b.label) && (
            <div className={s.rowHead}>
              <div className={s.left}>{b.label ? <TypeBadge t={b.label} /> : null}</div>
              <div className={s.right}>{b.title ? <h3 className={s.h3}>{b.title}</h3> : null}</div>
            </div>
          )}
          {b.items.map((it, i) => (
            <div key={i} className={s.row}>
              <div className={s.left}>{it.type ? <TypeBadge t={it.type}/> : null}</div>
              <div className={s.right}>
                <p className={s.text}>{it.text}</p>
                {it.subitems?.length ? <ul className={s.sublist}>{it.subitems.map((t,k)=><li key={k}>{t}</li>)}</ul> : null}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const anyItemHasType = b.items.some(it => !!it.type);
  return (
    <section className={s.section}>
      <div className={s.sectionFrame}>
        {b.title && <h3 className={`${s.h3} ${s.h3Tight}`}>{b.title}</h3>}
        {anyItemHasType ? (
          <div className={s.rowsIndented}>
            {b.items.map((it, i) => (
              <div key={i} className={`${s.row} ${s.rowTight}`}>
                <div className={s.left}>{it.type ? <TypeBadge t={it.type}/> : null}</div>
                <div className={s.right}>
                  <p className={s.text}>{it.text}</p>
                  {it.subitems?.length ? <ul className={s.sublist}>{it.subitems.map((t,k)=><li key={k}>{t}</li>)}</ul> : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ul className={s.bullets}>
            {b.items.map((it, i) => (
              <li key={i}>
                <span className={s.bulletText}>{it.text}</span>
                {it.subitems?.length ? <ul className={s.subBullets}>{it.subitems.map((t,k)=><li key={k}>{t}</li>)}</ul> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export function ChangelogPost({ post, anchorBtn }: { post: Post; anchorBtn?: React.ReactNode }) {
  // newest opens
  const newestDate = useMemo(
    () => POSTS.reduce((m, p) => (p.date > m ? p.date : m), "0000-00-00"),
    []
  );
  const isNewest = post.date === newestDate;
  const [open, setOpen] = useState<boolean>(isNewest);
  const { hash } = useLocation();

  useEffect(() => {
    if (hash === `#${post.id}`) setOpen(true);
  }, [hash, post.id]);

  const toggle = () => setOpen(v => !v);
  const onHeaderKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <article id={post.id} className={`${s.post} ${open ? "" : s.postCollapsed}`} aria-labelledby={`${post.id}-title`}>
      {/* Make the WHOLE header the toggle */}
      <header
        className={`${s.postHeader} ${s.postHeaderClickable}`}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-controls={`${post.id}-body`}
        onClick={toggle}
        onKeyDown={onHeaderKey}
      >
        <div className={s.titleWrap}>
          <span className={s.accentStripe} aria-hidden />
          <h2 id={`${post.id}-title`} className={s.postTitle}>{post.title}</h2>
          {post.tag && <span className={s.tag}>{post.tag}</span>}
        </div>

        <div className={s.metaRow}>
          <time dateTime={post.date} className={s.datePill}>
            {new Date(post.date).toLocaleDateString(undefined, { year:"numeric", month:"short", day:"numeric" })}
          </time>

          {/* state hint */}
          <span className={s.expandHint} aria-hidden="true">{open ? "Collapse" : "Expand"}</span>

          {/* Keep anchor button interactive without toggling the header */}
          {anchorBtn ? (
            <span className={s.noToggle} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
              {anchorBtn}
            </span>
          ) : null}
        </div>
      </header>

      <div id={`${post.id}-body`} className={`${s.body} ${open ? "" : s.bodyHidden}`}>
        {post.blocks.map((b, i) => <Block key={i} b={b} />)}
      </div>
    </article>
  );
}
