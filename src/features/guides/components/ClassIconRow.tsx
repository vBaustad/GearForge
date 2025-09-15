import s from "./components.module.css";
import { CLASSES, iconForClass } from "../data/specs";

type Props = {
  selected?: string | null;
  onSelect?: (classSlug: string | null) => void;
};

export function ClassIconRow({ selected, onSelect }: Props) {
  return (
    <div className={s.classRow} role="navigation" aria-label="Browse classes">
      {CLASSES.map((c) => (
        <button
          key={c.slug}
          type="button"
          className={[
            s.classLink,
            selected === c.slug ? s.classLinkSelected : "",
          ].join(" ")}
          title={c.name}
          onClick={() => onSelect?.(selected === c.slug ? null : c.slug)}
        >
          <span className={s.classCircle} aria-hidden>
            <img className={s.classImg} src={iconForClass(c.slug)} alt="" />
          </span>
          <span className={s.classLabel}>{c.name}</span>
        </button>
      ))}
    </div>
  );
}

