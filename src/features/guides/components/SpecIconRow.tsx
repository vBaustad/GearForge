import { Link } from "react-router-dom";
import s from "./components.module.css";
import { SPECS, iconForSpec } from "../data/specs";

type Props = {
  classFilter?: string | null;
};

export function SpecIconRow({ classFilter }: Props) {
  return (
    <div className={s.specRow} role="navigation" aria-label="Browse specs">
      {SPECS.filter(sp => !classFilter || sp.classSlug === classFilter).map((sp) => (
        <Link
          key={`${sp.classSlug}-${sp.specSlug}`}
          to={`/guides/classes/${sp.classSlug}/${sp.specSlug}`}
          className={s.specLink}
          title={`${sp.className} - ${sp.specName}`}
        >
          <span className={s.specCircle} aria-hidden>
            <img className={s.specImg} src={iconForSpec(sp.classSlug, sp.specSlug)} alt="" />
          </span>
          <span className={s.specLabel}>{sp.specName}</span>
        </Link>
      ))}
    </div>
  );
}

