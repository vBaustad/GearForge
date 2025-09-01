import { Link, NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import c from "./components.module.css";

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
          {["Home", "Tools", "Guides", "About"].map((item) => (
            <NavLink
              key={item}
              to={item === "Home" ? "/" : `/${item.toLowerCase()}`}
              className={({ isActive }) =>
                isActive ? `${c.navLink} ${c.navLinkActive}` : c.navLink
              }
              end={item === "Home"}
            >
              {item}
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
