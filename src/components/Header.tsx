// src/components/Header.tsx
import { Link, NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import c from "./components.module.css";

type NavItem = { label: string; to: string; end?: boolean };

const NAV: NavItem[] = [
  { label: "Home", to: "/", end: true },
  { label: "Optimizer", to: "/optimizer" }, // stays active for /optimizer/view
  { label: "Guides", to: "/guides" },
  { label: "FAQ", to: "/faq" },
  // add { label: "Terms", to: "/terms" } or "Privacy" if you want them in top nav
];

export function Header() {
  return (
    <header className={c.headerRoot}>
      <div className={c.headerInner}>
        {/* Brand */}
        <Link to="/" className={c.brand}>
          GearForge
        </Link>

        {/* Desktop nav */}
        <nav className={c.nav} aria-label="Primary">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? `${c.navLink} ${c.navLinkActive}` : c.navLink
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Mobile menu button (stub) */}
        <button className={c.mobileBtn} aria-label="Open menu">
          <Menu className={c.mobileIcon} />
        </button>
      </div>
    </header>
  );
}
