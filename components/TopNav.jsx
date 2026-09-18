"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import ProfilePopup from "./ProfilePopup";
import AuthForm from "./AuthForm";

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [navSearch, setNavSearch] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

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
    <>
      <header className="fixed top-0 left-0 right-0 z-[500]">
        <div className="h-[60px] flex items-center px-[18px] md:px-[24px] bg-white/92 backdrop-blur-[14px] border-b border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
          {/* Brand */}
          <Link href="/" className="inline-flex items-center gap-[12px] shrink-0 no-underline" aria-label="Hi Pando home">
            <span className="grid place-items-center w-[36px] h-[36px] overflow-hidden border-2 border-ink rounded-full bg-[#f4eee2] shadow-[2px_2px_0_#1e1e22] shrink-0">
              <img src={MASCOT_URL} alt="" className="w-[124%] h-[124%] object-cover object-[50%_30%]" />
            </span>
            <span className="font-sans text-[20px] font-extrabold tracking-[-0.04em] text-ink">Hi Pando!</span>
          </Link>

          {/* Search bar */}
          <form className="relative w-[min(480px,38vw)] max-lg:w-[min(360px,32vw)] max-sm:hidden h-[44px] flex items-center ml-[22px] shrink-0" onSubmit={handleSearch}>
            <svg className="absolute left-[16px] w-[18px] h-[18px] text-ink pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Search areas, projects, or anything in Dubai…"
              className="w-full h-full pl-[48px] pr-[18px] border border-[#e2e3e6] rounded-[24px] outline-none bg-[#f9fafb] text-[13.5px] font-medium text-[#202126] transition-[border-color,box-shadow] duration-200 placeholder:text-[#94969c] focus:bg-white focus:border-hp-primary focus:shadow-[0_0_0_4px_rgba(210,44,35,0.08)]"
            />
          </form>

          {/* Nav tabs */}
          <nav className="flex items-center gap-[30px] max-lg:gap-[20px] max-[860px]:hidden ml-auto pr-[20px]">
            {NAV_TABS.map((tab) => (
              <Link
                key={tab.label}
                href={tab.href}
                className={`relative text-[14px] font-bold text-[#1d1e22] no-underline transition-colors duration-200 whitespace-nowrap hover:text-hp-primary ${isActive(tab.href) ? "text-hp-primary after:content-[''] after:absolute after:left-1/2 after:-bottom-[20px] after:w-[22px] after:h-[3px] after:-translate-x-1/2 after:rounded-[10px] after:bg-hp-primary" : ""}`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-[8px] shrink-0">
            {user ? (
              <button 
                onClick={() => setIsProfileOpen(true)} 
                className="inline-flex items-center gap-[6px] min-h-[34px] px-[12px] border border-ink rounded-full text-ink no-underline text-[9.5px] max-sm:text-[8.5px] max-sm:px-[9px] font-black tracking-[0.08em] bg-[#fffaf3]/70 whitespace-nowrap transition-transform duration-150 hover:-translate-y-[1px]"
              >
                <div className="w-[24px] h-[24px] rounded-full bg-rose-600 text-white flex items-center justify-center text-[12px] font-bold">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                Hi, {user.name || 'User'}
              </button>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)} 
                className="inline-flex items-center gap-[6px] min-h-[34px] px-[12px] border border-ink rounded-full text-ink no-underline text-[9.5px] max-sm:text-[8.5px] max-sm:px-[9px] font-black tracking-[0.08em] bg-[#fffaf3]/70 whitespace-nowrap transition-transform duration-150 hover:-translate-y-[1px] cursor-pointer"
              >
                SIGN IN / SIGN UP
              </button>
            )}
            <Link href="/explore" className="inline-flex items-center gap-[5px] min-h-[34px] px-[12px] border border-hp-primary rounded-full bg-hp-primary text-[#fffaf3] no-underline text-[9.5px] font-black tracking-[0.08em] whitespace-nowrap transition-all duration-150 hover:bg-ink hover:border-ink hover:-translate-y-[1px] max-[860px]:hidden">
              EXPLORE MAP
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </Link>

            {/* Hamburger */}
            <button
              className="hidden max-[860px]:flex w-[36px] h-[36px] items-center justify-center bg-transparent border border-black/25 rounded-[8px] text-ink"
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
        <div className={`max-[860px]:flex flex-col bg-white/97 backdrop-blur-[14px] border-b border-black/10 overflow-hidden transition-all duration-300 ease-out ${open ? 'max-h-[400px] py-[8px]' : 'max-h-0 py-0 pointer-events-none'}`}>
          {NAV_TABS.map((tab) => (
            <Link
              key={tab.label}
              href={tab.href}
              className="px-[24px] py-[14px] text-[15px] font-bold text-ink no-underline border-b border-black/5 transition-colors duration-150 hover:bg-hp-primary/5 hover:text-hp-primary"
              onClick={() => setOpen(false)}
            >
              {tab.label}
            </Link>
          ))}
          {user ? (
            <button onClick={() => { setIsProfileOpen(true); setOpen(false); }} className="px-[24px] py-[14px] text-[15px] font-bold text-ink text-left border-b border-black/5 bg-transparent border-none cursor-pointer hover:bg-hp-primary/5 hover:text-hp-primary">
              Profile ({user.name || 'User'})
            </button>
          ) : (
            <button 
              onClick={() => { setShowAuthModal(true); setOpen(false); }} 
              className="px-[24px] py-[14px] text-[15px] font-bold text-ink text-left bg-transparent border-none cursor-pointer border-b border-black/5 transition-colors duration-150 hover:bg-hp-primary/5 hover:text-hp-primary"
            >
              Sign In / Sign Up
            </button>
          )}
        </div>
      </header>

      {isProfileOpen && <ProfilePopup onClose={() => setIsProfileOpen(false)} />}
      {showAuthModal && <AuthForm mode="sign-in" onSwitchMode={(m) => {}} onClose={() => setShowAuthModal(false)} />}
    </>
  );
}
