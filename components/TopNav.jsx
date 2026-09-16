"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./TopNav.module.css";

const MASCOT_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hf_20260623_061342_344d0b5a-9b73-4799-b66d-cb78af38510c-Photoroom-8tRuDAVe4O0Gxxg6amlBrVSCOL6ouf.png";

const NAV_TABS = [
  { label: "Buy", href: "/search?purpose=sale" },
  { label: "Rent", href: "/search?purpose=rent" },
  { label: "Off-Plan", href: "/search?type=Off-Plan" },
  { label: "Explore Map", href: "/explore" },
];

export default function TopNav() {
  const [open, setOpen] = useState(false);
  const [navSearch, setNavSearch] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  // Hide on home page, search/properties page, explore map, and property detail pages
  if (pathname === "/" || pathname === "/search" || pathname === "/explore" || pathname?.startsWith("/property")) return null;

  const isActive = (href) => {
    const base = href.split("?")[0];
    return pathname === base;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (navSearch.trim()) {
      router.push(`/search?q=${encodeURIComponent(navSearch.trim())}`);
    }
  };

  return (
    <header className={styles.wrap}>
      <div className={styles.inner}>
        {/* Brand */}
        <Link href="/" className={styles.brand} aria-label="Hi Pando home">
          <span className={styles.avatar}>
            <img src={MASCOT_URL} alt="" />
          </span>
          <span className={styles.brandName}>Hi Pando!</span>
        </Link>

        {/* Search bar */}
        <form className={styles.search} onSubmit={handleSearch}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            placeholder="Search areas, projects, or anything in Dubai…"
            className={styles.searchInput}
          />
        </form>

        {/* Nav tabs */}
        <nav className={styles.nav}>
          {NAV_TABS.map((tab) => (
            <Link
              key={tab.label}
              href={tab.href}
              className={`${styles.tab} ${isActive(tab.href) ? styles.tabActive : ""}`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          <Link href="/sign-in" className={styles.actionSoft}>
            SIGN IN / SIGN UP
          </Link>
          <Link href="/explore" className={styles.actionPrimary}>
            EXPLORE MAP
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 17L17 7M17 7H7M17 7v10" />
            </svg>
          </Link>

          {/* Hamburger */}
          <button
            className={styles.hamburger}
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
              <path d="M1 1H17M1 7H17M1 13H17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`${styles.mobileMenu} ${open ? styles.open : ""}`}>
        {NAV_TABS.map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            className={styles.mobileTab}
            onClick={() => setOpen(false)}
          >
            {tab.label}
          </Link>
        ))}
        <Link href="/sign-in" className={styles.mobileTab} onClick={() => setOpen(false)}>
          Sign In / Sign Up
        </Link>
      </div>
    </header>
  );
}
