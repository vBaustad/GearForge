"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, Upload, User, Compass, LogOut, ChevronDown, UserCircle, Menu, X, Package, Shield, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { BlizzardLoginButton } from "./BlizzardLoginButton";

// Helper component to replace NavLink
function NavLinkItem({
  href,
  children,
  onClick,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname?.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`${className} ${isActive ? "active" : ""}`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  return (
    <header className="header" role="banner">
      <div className="header-container">
        {/* Top row: Logo, Search, Nav */}
        <div className="header-main">
          {/* Logo */}
          <Link href="/" className="header-logo">
            <img
              src="/gearforge_logo_new.png"
              alt="GearForge"
              className="header-logo-img"
            />
            <span className="header-logo-text">GearForge</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="header-search" role="search">
            <Search size={18} className="header-search-icon" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search designs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="header-search-input"
              aria-label="Search designs"
            />
          </form>

          {/* Nav */}
          <nav className="header-nav" aria-label="Main navigation">
            <NavLinkItem href="/browse" className="header-nav-link">
              <Compass size={18} />
              <span>Browse</span>
            </NavLinkItem>

            <NavLinkItem href="/upload" className="header-nav-link">
              <Upload size={18} />
              <span>Upload</span>
            </NavLinkItem>

            <NavLinkItem href="/decor" className="header-nav-link">
              <Package size={18} />
              <span>Items</span>
            </NavLinkItem>

            {/* User menu */}
            {isLoading ? (
              <div className="header-login" style={{ opacity: 0.5 }}>
                <div className="skeleton" style={{ width: '18px', height: '18px', borderRadius: '50%' }} />
              </div>
            ) : isAuthenticated && user ? (
              <div className="user-menu-container">
                <button
                  className="header-user-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-expanded={showUserMenu}
                  aria-haspopup="menu"
                  aria-label="User menu"
                >
                  <div className="header-user-avatar">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.battleTag} />
                    ) : (
                      <User size={16} />
                    )}
                  </div>
                  <span className="header-user-name">{user.battleTag.split('#')[0]}</span>
                  <ChevronDown size={14} />
                </button>

                {showUserMenu && (
                  <>
                    <div className="user-menu-backdrop" onClick={() => setShowUserMenu(false)} aria-hidden="true" />
                    <div className="user-menu" role="menu" onClick={(e) => e.stopPropagation()}>
                      <div className="user-menu-header">
                        <span className="user-menu-battletag">{user.battleTag}</span>
                      </div>
                      <button
                        className="user-menu-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowUserMenu(false);
                          router.push(`/user/${user.id}`);
                        }}
                      >
                        <UserCircle size={16} />
                        My Profile
                      </button>
                      <button
                        className="user-menu-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowUserMenu(false);
                          router.push("/settings");
                        }}
                      >
                        <Settings size={16} />
                        Settings
                      </button>
                      {user.role === "admin" && (
                        <button
                          className="user-menu-item user-menu-admin"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowUserMenu(false);
                            router.push("/admin");
                          }}
                        >
                          <Shield size={16} />
                          Admin Panel
                        </button>
                      )}
                      <button onClick={handleLogout} className="user-menu-item">
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <BlizzardLoginButton className="header-blizzard-btn" />
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle menu"
          >
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {showMobileMenu && (
          <>
            <div className="mobile-menu-backdrop" onClick={() => setShowMobileMenu(false)} aria-hidden="true" />
            <nav className="mobile-menu" aria-label="Mobile navigation">
              <NavLinkItem
                href="/browse"
                className="mobile-menu-link"
                onClick={() => setShowMobileMenu(false)}
              >
                <Compass size={20} />
                Browse
              </NavLinkItem>
              <NavLinkItem
                href="/upload"
                className="mobile-menu-link"
                onClick={() => setShowMobileMenu(false)}
              >
                <Upload size={20} />
                Upload
              </NavLinkItem>
              <NavLinkItem
                href="/decor"
                className="mobile-menu-link"
                onClick={() => setShowMobileMenu(false)}
              >
                <Package size={20} />
                Items
              </NavLinkItem>
              {isAuthenticated && user ? (
                <>
                  <NavLinkItem
                    href={`/user/${user.id}`}
                    className="mobile-menu-link"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <UserCircle size={20} />
                    My Profile
                  </NavLinkItem>
                  <NavLinkItem
                    href="/settings"
                    className="mobile-menu-link"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Settings size={20} />
                    Settings
                  </NavLinkItem>
                  {user.role === "admin" && (
                    <NavLinkItem
                      href="/admin"
                      className="mobile-menu-link mobile-menu-admin"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Shield size={20} />
                      Admin Panel
                    </NavLinkItem>
                  )}
                  <button
                    className="mobile-menu-link"
                    onClick={() => {
                      logout();
                      setShowMobileMenu(false);
                    }}
                  >
                    <LogOut size={20} />
                    Logout
                  </button>
                </>
              ) : (
                <div className="mobile-menu-login">
                  <BlizzardLoginButton size="large" />
                </div>
              )}
            </nav>
          </>
        )}
      </div>
    </header>
  );
}
