// Header.tsx
import { Link, NavLink } from "react-router-dom";
import { Menu } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-black border-b border-gray-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Brand */}
        <Link to="/" className="text-2xl font-bold text-yellow-500">
          GearForge
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-8 text-sm font-medium">
          {["Home", "Tools", "Guides", "About"].map((item) => (
            <NavLink
              key={item}
              to={item === "Home" ? "/" : `/${item.toLowerCase()}`}
              className={({ isActive }) =>
                `transition-colors hover:text-yellow-500 ${
                  isActive ? "text-yellow-500 font-semibold" : "text-gray-300"
                }`
              }
            >
              {item}
            </NavLink>
          ))}
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-md text-gray-400 hover:bg-gray-800"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
}
