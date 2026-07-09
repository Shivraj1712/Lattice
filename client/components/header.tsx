"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "../context/auth-context";
import { useToast } from "../context/toast-context";
import { isOffline } from "../lib/api";
import {
  Search,
  ChevronDown,
  Settings,
  LogOut,
  FolderKanban,
  Menu as MenuIcon,
  X,
} from "lucide-react";

interface HeaderProps {
  onSearch: (term: string, immediate?: boolean) => void;
  onSelectCategory: (category: string) => void;
  selectedCategory: string;
  onOpenAuth: (tab: "login" | "signup") => void;
  onOpenManage: (tab: "projects" | "add" | "profile") => void;
  projects: any[];
  searchValue?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onSearch,
  onSelectCategory,
  selectedCategory,
  onOpenAuth,
  onOpenManage,
  projects = [],
  searchValue = "",
}) => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState(searchValue);

  // Sync state when controlled value changes (e.g. cleared on close)
  useEffect(() => {
    setSearchTerm(searchValue);
  }, [searchValue]);

  // Dropdown states
  const [exploreMenuOpen, setExploreMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const [offline, setOffline] = useState(false);

  const exploreRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Sync offline banner state
  useEffect(() => {
    setOffline(isOffline());
    const handleOfflineChange = () => {
      setOffline(isOffline());
    };
    window.addEventListener("lattice_offline_status_changed", handleOfflineChange);
    return () => window.removeEventListener("lattice_offline_status_changed", handleOfflineChange);
  }, []);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exploreRef.current && !exploreRef.current.contains(e.target as Node)) {
        setExploreMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    onSearch(val, false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch(searchTerm, true);
    }
  };

  const handleCategorySelect = (cat: string) => {
    onSelectCategory(cat === "All" ? "" : cat);
    setExploreMenuOpen(false);
  };

  const getCategoryCount = (catName: string) => {
    if (catName === "All") return projects.length;
    return projects.filter(p => p.category?.toLowerCase() === catName.toLowerCase()).length;
  };

  const CATEGORY_ITEMS = [
    { name: "All", label: "All Projects", count: getCategoryCount("All").toString() },
    { name: "Frontend", label: "Frontend", count: getCategoryCount("Frontend").toString() },
    { name: "Backend", label: "Backend", count: getCategoryCount("Backend").toString() },
    { name: "Fullstack", label: "Fullstack", count: getCategoryCount("Fullstack").toString() },
    { name: "AI/ML", label: "AI/ML", count: getCategoryCount("AI/ML").toString() },
    { name: "Design", label: "Design", count: getCategoryCount("Design").toString() },
    { name: "Mobile", label: "Mobile", count: getCategoryCount("Mobile").toString() },
    { name: "Other", label: "Other", count: getCategoryCount("Other").toString() },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b-4 border-brand-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Row */}
        <div className="flex items-center justify-between h-20 gap-4">

          {/* Left Section: Logo */}
          <div className="flex items-center">
            <div
              className="flex items-center gap-2.5 cursor-pointer group"
              onClick={() => handleCategorySelect("All")}
            >
              <Image
                src="/icon.png"
                alt="Lattice Logo"
                width={32}
                height={32}
                className="h-8 w-8 object-contain transition-transform duration-200 group-hover:scale-105"
                priority
              />
              <span className="text-xl font-black uppercase text-brand-black tracking-tighter hover:text-brand-rose transition-colors">
                Lattice
              </span>
            </div>
          </div>

          {/* Right Section: Search, Explore, Log In, and Submit Project (Desktop Only) */}
          <div className="hidden md:flex items-center gap-6 flex-1 justify-end">

            {/* Search Input Bar */}
            <div className="relative w-56">
              <Search className="absolute left-3 top-3 text-brand-black" size={14} />
              <input
                type="text"
                placeholder="Search by Inspiration"
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                className="w-full pl-9 pr-3 py-2 bg-white border-2 border-brand-black rounded-none outline-none text-xs text-brand-black placeholder-brand-black font-bold shadow-[2px_2px_0px_0px_rgba(24,22,22,1)] focus:shadow-[3px_3px_0px_0px_rgba(24,22,22,1)] transition-all"
              />
            </div>

            {/* Explore selector */}
            <div className="relative" ref={exploreRef}>
              <button
                onClick={() => setExploreMenuOpen(!exploreMenuOpen)}
                className="flex items-center gap-1 font-black text-sm text-brand-black hover:text-brand-rose cursor-pointer transition-colors py-2 uppercase"
              >
                <span>Explore</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${exploreMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {exploreMenuOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white border-2 border-brand-black rounded-none shadow-[4px_4px_0px_0px_rgba(24,22,22,1)] z-50 p-5 space-y-2.5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-brand-black border-b-2 border-brand-black pb-2 mb-1.5">
                    Browse Categories
                  </div>
                  <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1">
                    {CATEGORY_ITEMS.map((item) => (
                      <div
                        key={item.name}
                        onClick={() => handleCategorySelect(item.name)}
                        className={`flex items-center justify-between text-xs font-black uppercase px-2 py-2 border-2 border-transparent cursor-pointer transition-all ${(item.name === "All" && selectedCategory === "") || selectedCategory === item.name
                          ? "bg-brand-rose text-white border-brand-black"
                          : "text-brand-black hover:bg-brand-black/10"
                          }`}
                      >
                        <span>{item.label}</span>
                        <span className={`font-mono text-[10px] font-black ${(item.name === "All" && selectedCategory === "") || selectedCategory === item.name
                          ? "text-white"
                          : "text-brand-black"
                          }`}>{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Auth & Settings */}
            {user ? (
              <>
                {/* Profile dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 bg-white border-2 border-brand-black rounded-none hover:bg-zinc-50 transition-all cursor-pointer font-black text-xs uppercase"
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="w-6.5 h-6.5 border-2 border-brand-black object-cover"
                      />
                    ) : (
                      <div className="w-6.5 h-6.5 bg-brand-rose text-white flex items-center justify-center font-black border-2 border-brand-black">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="hidden sm:inline pr-1 text-brand-black">{user.name.split(" ")[0]}</span>
                    <ChevronDown size={12} className="text-brand-black mr-0.5" />
                  </button>

                  {/* Profile Dropdown panel */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white border-2 border-brand-black rounded-none shadow-[4px_4px_0px_0px_rgba(24,22,22,1)] py-1 overflow-hidden z-20">
                      <div className="px-4 py-2.5 border-b-2 border-brand-black bg-zinc-50">
                        <p className="text-sm font-black text-brand-black truncate">{user.name}</p>
                        <p className="text-[10px] text-brand-black font-bold truncate mt-0.5">{user.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          onOpenManage("projects");
                          setProfileDropdownOpen(false);
                        }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-black uppercase text-brand-black hover:bg-brand-black/10 transition-colors text-left cursor-pointer"
                      >
                        <FolderKanban size={14} className="text-brand-black" />
                        <span>My Projects</span>
                      </button>

                      <button
                        onClick={() => {
                          onOpenManage("profile");
                          setProfileDropdownOpen(false);
                        }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-black uppercase text-brand-black hover:bg-brand-black/10 transition-colors text-left cursor-pointer"
                      >
                        <Settings size={14} className="text-brand-black" />
                        <span>Settings</span>
                      </button>

                      <button
                        onClick={async () => {
                          await logout();
                          toast.success("Logged out successfully.");
                          setProfileDropdownOpen(false);
                        }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-black uppercase text-brand-rose hover:bg-brand-rose/10 transition-colors text-left border-t-2 border-brand-black cursor-pointer"
                      >
                        <LogOut size={14} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => onOpenAuth("login")}
                className="text-brand-black hover:text-brand-rose text-sm font-black uppercase cursor-pointer"
              >
                Log in
              </button>
            )}

            {/* Submit Project Button */}
            <button
              onClick={() => {
                if (user) {
                  onOpenManage("add");
                } else {
                  onOpenAuth("login");
                }
              }}
              className="awwwards-btn-secondary px-5 py-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(24,22,22,1)]"
            >
              Submit Project
            </button>
          </div>

          {/* Mobile Right Actions: Search Icon & Menu Burger (Mobile Only) */}
          <div className="flex md:hidden items-center gap-2">
            {/* Mobile Search Toggle Icon */}
            <button
              onClick={() => {
                setMobileSearchOpen(!mobileSearchOpen);
                setMobileMenuOpen(false); // Close menu drawer when opening search
              }}
              className={`p-2.5 border-2 border-brand-black rounded-none flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_0px_rgba(24,22,22,1)] active:translate-y-[1px] transition-colors ${mobileSearchOpen ? "bg-brand-black text-white" : "bg-white text-brand-black"
                }`}
            >
              <Search size={18} />
            </button>

            {/* Mobile Menu Burger Button */}
            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setMobileSearchOpen(false); // Close search when opening menu drawer
              }}
              className={`p-2.5 border-2 border-brand-black rounded-none bg-white hover:bg-zinc-50 text-brand-black flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_0px_rgba(24,22,22,1)] active:translate-y-[1px]`}
            >
              {mobileMenuOpen ? <X size={18} /> : <MenuIcon size={18} />}
            </button>
          </div>

        </div>

        {/* Mobile Search Input Box - Visible ONLY when mobileSearchOpen is active (Mobile Only) */}
        {mobileSearchOpen && (
          <div className="py-3 border-t-2 border-brand-black flex flex-col gap-3 md:hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-3.5 text-brand-black" size={16} />
              <input
                type="text"
                placeholder="Search by Inspiration"
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                className="w-full pl-11 pr-4 py-2.5 bg-white border-2 border-brand-black rounded-none outline-none text-sm text-brand-black font-bold shadow-[2px_2px_0px_0px_rgba(24,22,22,1)]"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-brand-black bg-white p-6 space-y-6 shadow-lg">
          <div className="flex flex-col gap-3.5">
            {user ? (
              <>
                <div className="p-3 border-2 border-brand-black bg-zinc-50 text-xs font-black uppercase tracking-wider text-brand-black">
                  User: {user.name}
                </div>
                <button
                  onClick={() => {
                    onOpenManage("add");
                    setMobileMenuOpen(false);
                  }}
                  className="awwwards-btn-primary w-full py-3.5 text-xs text-center shadow-[2px_2px_0px_0px_rgba(24,22,22,1)]"
                >
                  Submit Project
                </button>
                <button
                  onClick={() => {
                    onOpenManage("projects");
                    setMobileMenuOpen(false);
                  }}
                  className="awwwards-btn-secondary w-full py-3.5 text-xs text-center shadow-[2px_2px_0px_0px_rgba(24,22,22,1)]"
                >
                  My Projects
                </button>
                <button
                  onClick={() => {
                    onOpenManage("profile");
                    setMobileMenuOpen(false);
                  }}
                  className="awwwards-btn-secondary w-full py-3.5 text-xs text-center shadow-[2px_2px_0px_0px_rgba(24,22,22,1)]"
                >
                  Settings
                </button>
                <button
                  onClick={async () => {
                    await logout();
                    setMobileMenuOpen(false);
                  }}
                  className="awwwards-btn-secondary w-full py-3.5 text-xs text-center border-rose-600 text-rose-600 hover:bg-rose-50 shadow-[2px_2px_0px_0px_rgba(24,22,22,1)]"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    onOpenAuth("login");
                    setMobileMenuOpen(false);
                  }}
                  className="awwwards-btn-secondary w-full py-3.5 text-xs text-center shadow-[2px_2px_0px_0px_rgba(24,22,22,1)]"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    onOpenAuth("login");
                    setMobileMenuOpen(false);
                  }}
                  className="awwwards-btn-primary w-full py-3.5 text-xs text-center shadow-[2px_2px_0px_0px_rgba(24,22,22,1)]"
                >
                  Submit Project
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
