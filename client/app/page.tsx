"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "../context/auth-context";
import { api, Project } from "../lib/api";
import { USER_ID_TO_EMAIL } from "../lib/profile-details";
import { useRouter } from "next/navigation";
import { Header } from "../components/header";
import { ProjectCard } from "../components/project-card";
import { ProjectDetailModal } from "../components/project-detail-modal";
import { ProjectManageModal } from "../components/project-manage-modal";
import { AuthModal } from "../components/auth-modal";
import { PublicProfileModal } from "../components/public-profile-modal";
import { Loader2, Sparkles, AlertCircle, ArrowRight } from "lucide-react";

export default function Home() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  
  // Projects State
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState(""); // raw input, debounced into searchTerm
  const [selectedCategory, setSelectedCategory] = useState("");

  // Modal States
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  
  const [manageOpen, setManageOpen] = useState(false);
  const [manageTab, setManageTab] = useState<"projects" | "add" | "profile">("projects");

  // Public Profile Modal State
  const [profileModalData, setProfileModalData] = useState<{
    email: string;
    name: string;
    avatarUrl: string | null;
    userId?: string;
  } | null>(null);

  const openProfileModal = (email: string, name: string, avatarUrl: string | null, userId?: string) => {
    setProfileModalData({ email, name, avatarUrl, userId });
  };

  const closeProfileModal = () => setProfileModalData(null);

  // Featured author profile cache
  const [featuredProfile, setFeaturedProfile] = useState<null | { name: string; email: string; avatar?: string }>(null);

  useEffect(() => {
    let mounted = true;
    setFeaturedProfile(null);
    const email = projects[0]?.user?.email || (projects[0]?.user_id ? USER_ID_TO_EMAIL[projects[0].user_id] : undefined);
    if (!email) return;
    import("../lib/profile-cache").then(({ fetchCachedPublicProfile }) => {
      fetchCachedPublicProfile(email).then((p) => {
        if (!mounted) return;
        if (p) setFeaturedProfile({ name: p.name, email: p.email, avatar: (p as any).avatar || p.avatar_url });
      });
    });
    return () => {
      mounted = false;
    };
  }, [projects[0]?.project_id]);

  // Fetch projects on load
  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getAllProjects();
      if (response.success && response.data) {
        const sorted = [...response.data].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setProjects(sorted);
      } else {
        setProjects([]);
      }
    } catch (err: any) {
      console.error(err);
      setError("Unable to load projects. Ensure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Debounce search input -> searchTerm (300ms)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchInput === searchTerm) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchTerm(searchInput), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput, searchTerm]);

  // Safeguard: Close Auth Modal if user is logged in
  useEffect(() => {
    if (user && authOpen) {
      setAuthOpen(false);
    }
  }, [user, authOpen]);

  // Listen to Escape key to clear search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchInput("");
        setSearchTerm("");
        setSelectedCategory("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Memoized filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((proj) => {
      if (selectedCategory && proj.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return proj.title.toLowerCase().includes(term) || proj.description.toLowerCase().includes(term);
      }
      return true;
    });
  }, [projects, searchTerm, selectedCategory]);

  const onSearch = useCallback((val: string, immediate = false) => {
    setSearchInput(val);
    if (immediate) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSearchTerm(val);
    }
  }, []);
  const onSelectCategory = useCallback((cat: string) => setSelectedCategory(cat), []);


  const openAuthModal = (tab: "login" | "signup") => {
    setAuthTab(tab);
    setAuthOpen(true);
  };

  const openManageModal = (tab: "projects" | "add" | "profile") => {
    setManageTab(tab);
    setManageOpen(true);
  };

  const getFeaturedAuthorName = () => {
    if (!projects[0]) return user?.name || user?.email || "Unknown";
    if (user && projects[0].user_id === user.user_id) {
      return user.name || user.email || "Unknown";
    }
    return featuredProfile?.name || projects[0].user?.name || projects[0].user?.email || "Unknown";
  };

  const getFeaturedAuthorAvatar = () => {
    if (!projects[0]) return user?.avatar_url || null;
    if (user && projects[0].user_id === user.user_id) {
      return user.avatar_url || null;
    }
    return featuredProfile?.avatar || projects[0].user?.avatar_url || null;
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-brand-black selection:bg-brand-rose selection:text-white">
      <Header
        onSearch={onSearch}
        onSelectCategory={onSelectCategory}
        selectedCategory={selectedCategory}
        onOpenAuth={openAuthModal}
        onOpenManage={openManageModal}
        projects={projects}
        searchValue={searchInput}
      />

      {/* Hero Banner wrapper with Search Overlay */}
      <div className="relative">
        {/* Overlay search results panel */}
        {(searchTerm || selectedCategory) && (
          <div className="absolute inset-0 z-30 bg-white/95 backdrop-blur-xs border-b-4 border-brand-black flex flex-col overflow-y-auto animate-slide-in">
            <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col h-full justify-between">
              <div className="space-y-6">
                
                {/* Header of Search Modal */}
          <div className="flex items-center justify-between border-b-2 border-brand-black pb-4 flex-wrap gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                    <span className="relative flex h-3 w-3 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-rose opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-rose border border-brand-black"></span>
                      </span>
                      <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-brand-black truncate">
                        Matches:{" "}
                        <span className="text-brand-rose">
                          {searchTerm ? `"${searchTerm}"` : ""}
                          {searchTerm && selectedCategory ? " + " : ""}
                          {selectedCategory ? `[${selectedCategory}]` : ""}
                        </span>
                      </h2>
                    </div>
                  <button
                    onClick={() => {
                      setSearchInput("");
                      setSearchTerm("");
                      setSelectedCategory("");
                    }}
                    className="p-1 border-2 border-transparent hover:border-brand-black text-brand-rose font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex-shrink-0"
                  >
                    Close [x]
                  </button>
                </div>

                {/* Match count and active filters */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap gap-2">
                    {searchTerm && (
                      <span className="px-2.5 py-1 bg-zinc-100 border border-brand-black font-semibold flex items-center gap-1.5 uppercase text-[10px]">
                        Query: {searchTerm}
                        <button onClick={() => { setSearchInput(""); setSearchTerm(""); }} className="text-brand-rose font-black hover:underline cursor-pointer">×</button>
                      </span>
                    )}
                    {selectedCategory && (
                      <span className="px-2.5 py-1 bg-zinc-100 border border-brand-black font-semibold flex items-center gap-1.5 uppercase text-[10px]">
                        Cat: {selectedCategory}
                        <button onClick={() => setSelectedCategory("")} className="text-brand-rose font-black hover:underline cursor-pointer">×</button>
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-zinc-500 uppercase text-[10px]">
                    {filteredProjects.length} matches
                  </span>
                </div>

                {/* Related Search List */}
                {filteredProjects.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProjects.map((proj) => (
                      <div
                        key={proj.project_id}
                        onClick={() => setSelectedProject(proj)}
                        className="group bg-white border-2 border-brand-black p-4 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(24,22,22,1)] shadow-[2px_2px_0px_0px_rgba(24,22,22,1)] transition-all cursor-pointer flex flex-col justify-between h-40"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 bg-brand-pink/35 border border-brand-black text-[9px] font-black uppercase tracking-wider text-brand-rose">
                              {proj.category}
                            </span>
                            <span className="text-[8px] font-mono text-zinc-400 uppercase">
                              {new Date(proj.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="text-sm font-black uppercase tracking-tight text-brand-black group-hover:text-brand-rose transition-colors truncate">
                            {proj.title}
                          </h3>
                          <p className="text-[10px] text-zinc-700 font-semibold leading-relaxed line-clamp-3">
                            {proj.description}
                          </p>
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-wider text-brand-rose flex items-center gap-1.5 pt-2 border-t border-zinc-100 group-hover:gap-2 transition-all">
                          Inspect details <ArrowRight size={10} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-zinc-50 border-2 border-brand-black border-dashed p-12 text-center text-xs font-black uppercase tracking-widest text-zinc-500">
                    No matching registry records found.
                  </div>
                )}

              </div>
              
              <div className="text-[9px] text-zinc-400 font-mono uppercase tracking-widest pt-6 border-t border-zinc-100 text-left">
                Lattice Search Engine - Press esc or click close to return to index
              </div>

            </div>
          </div>
        )}

        <section className="relative py-6 px-4 md:py-12 md:px-8 bg-zinc-50 border-b-4 border-brand-black">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column - Copy & Actions */}
          <div className="lg:col-span-7 space-y-5 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-rose border-2 border-brand-black text-white text-[10px] font-black uppercase tracking-wider rounded-none">
              <Sparkles size={10} className="stroke-[2.5]" />
              <span>Project Showcase - Live</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black uppercase tracking-tight leading-[0.95] text-brand-black">
              Explore
              <br />
              <span className="bg-gradient-to-r from-brand-rose to-brand-rose bg-clip-text text-transparent">
                Developer code
              </span>
              <br />
              At Scale.
            </h1>

            <p className="text-xs sm:text-sm text-brand-black font-semibold leading-relaxed max-w-xl uppercase tracking-wide">
              Lattice is a minimalist gallery index for full-stack websites, codebase reviews, and backend APIs.
            </p>

            <div className="flex items-center gap-3 pt-1">
              {user ? (
                <button
                  onClick={() => openManageModal("add")}
                  className="awwwards-btn-primary px-5 py-2.5 text-xs flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(24,22,22,1)]"
                >
                  <span>Submit Project</span>
                  <ArrowRight size={13} />
                </button>
              ) : (
                <button
                  onClick={() => openAuthModal("signup")}
                  className="awwwards-btn-primary px-5 py-2.5 text-xs flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(24,22,22,1)]"
                >
                  <span>Create Workspace</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 border-2 border-brand-black divide-x-2 divide-brand-black bg-white rounded-none shadow-[4px_4px_0px_0px_rgba(24,22,22,1)] max-w-xs">
              <div className="p-3">
                <p className="text-lg sm:text-xl font-black text-brand-black">{projects.length}</p>
                <p className="text-[8px] sm:text-[9px] text-brand-black font-black uppercase tracking-wider">Projects</p>
              </div>
              <div className="p-3">
                <p className="text-lg sm:text-xl font-black text-brand-black">
                  {new Set(projects.map((p) => p.user_id)).size}
                </p>
                <p className="text-[8px] sm:text-[9px] text-brand-black font-black uppercase tracking-wider">Creators</p>
              </div>
              <div className="p-3">
                <p className="text-lg sm:text-xl font-black text-brand-black">
                  {projects.filter((p) => p.live_demo_link).length}
                </p>
                <p className="text-[8px] sm:text-[9px] text-brand-black font-black uppercase tracking-wider">Live</p>
              </div>
            </div>
          </div>

          {/* Right Column - Increased size Hero card containing complete project info */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end w-full">
            <div className="w-full max-w-[480px] bg-white border-2 border-brand-black rounded-none shadow-[8px_8px_0px_0px_rgba(24,22,22,1)] p-4 sm:p-6 space-y-4 sm:space-y-6 flex flex-col justify-between group overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-brand-black pb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-black">
                    Featured Project Review - 01
                  </span>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-rose opacity-75 border border-brand-black"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-rose border border-brand-black"></span>
                  </span>
                </div>

                <div className="space-y-2.5">
                  <h3
                    onClick={() => projects[0] && setSelectedProject(projects[0])}
                    className="text-xl font-black uppercase tracking-tight text-brand-black hover:text-brand-rose transition-colors truncate cursor-pointer"
                  >
                    {projects[0] ? projects[0].title : "Lattice Portal Core"}
                  </h3>
                  <p className="text-xs text-brand-black font-semibold leading-relaxed line-clamp-3">
                    {projects[0] ? projects[0].description : "A high-performance repository manager featuring backend Go/Fiber router stacks, SQLite/PostgreSQL schemas, and Next.js static layouts."}
                  </p>
                </div>
              </div>

              {/* Complete Project Info monospaced details list */}
              <div className="border-2 border-brand-black p-4 space-y-2.5 font-mono text-[10px] text-brand-black bg-zinc-50 rounded-none overflow-hidden">
                <div className="flex justify-between items-center gap-2 overflow-hidden">
                  <span className="shrink-0">PROJECT NAME:</span>
                  <button
                    onClick={() => projects[0] && setSelectedProject(projects[0])}
                    className="font-bold truncate text-right uppercase text-brand-black hover:text-brand-rose hover:underline cursor-pointer border-none bg-transparent p-0 font-mono text-[10px]"
                  >
                    {projects[0] ? projects[0].title : "LATTICE PORTAL CORE"}
                  </button>
                </div>
                <div className="flex justify-between items-center gap-2 overflow-hidden border-t border-brand-black pt-1.5">
                  <span>REPOSITORY:</span>
                  {projects[0] ? (
                    <a
                      href={projects[0].github_link.startsWith("http") ? projects[0].github_link : `https://${projects[0].github_link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold truncate text-right uppercase text-brand-black hover:text-brand-rose hover:underline cursor-pointer"
                    >
                      {projects[0].github_link.replace("https://", "").replace("http://", "")}
                    </a>
                  ) : (
                    <span className="font-bold truncate text-right uppercase">GITHUB.COM/SHIVRAJ/LATTICE</span>
                  )}
                </div>
                <div className="flex justify-between items-center gap-2 overflow-hidden border-t border-brand-black pt-1.5">
                  <span>CATEGORY:</span>
                  <span className="font-bold truncate text-right uppercase">
                    {projects[0] ? projects[0].category : "FULLSTACK"}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2 overflow-hidden border-t border-brand-black pt-1.5">
                  <span>PUBLISHED:</span>
                  <span className="font-bold truncate text-right uppercase">
                    {projects[0] ? new Date(projects[0].created_at).toLocaleDateString() : "07/08/2026"}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2 overflow-hidden border-t border-brand-black pt-1.5">
                  <span>DEMO LINK:</span>
                  {projects[0] ? (
                    <a
                      href={projects[0].live_demo_link.startsWith("http") ? projects[0].live_demo_link : `https://${projects[0].live_demo_link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-brand-rose truncate text-right uppercase hover:underline cursor-pointer"
                    >
                      {projects[0].live_demo_link.replace("https://", "").replace("http://", "")}
                    </a>
                  ) : (
                    <span className="font-bold text-brand-rose truncate text-right uppercase">LATTICE-DEMO.VERCEL.APP</span>
                  )}
                </div>
              </div>

              {/* Author footer */}
              <div
                onClick={() => {
                  const feat = projects[0];
                  if (!feat) return;
                  const targetUserId = feat.user_id;
                  const targetEmail = feat.user?.email || USER_ID_TO_EMAIL[targetUserId];
                  const targetName = getFeaturedAuthorName();
                  if (targetUserId && targetEmail) {
                    router.push(`/profile/${targetUserId}?email=${encodeURIComponent(targetEmail)}&name=${encodeURIComponent(targetName)}`);
                  }
                }}
                className="flex items-center justify-between border-t-2 border-brand-black pt-4 cursor-pointer hover:bg-zinc-50 transition-all"
              >
                <div className="flex items-center gap-2">
                  {getFeaturedAuthorAvatar() ? (
                    <img
                      src={getFeaturedAuthorAvatar()!}
                      alt={getFeaturedAuthorName()}
                      className="w-6 h-6 object-cover border-2 border-brand-black"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-brand-black border-2 border-brand-black flex items-center justify-center text-[10px] font-black uppercase text-white">
                      {getFeaturedAuthorName().charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-black uppercase tracking-wider text-brand-black truncate max-w-[150px]">
                    {getFeaturedAuthorName()}
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-brand-black">Author ↗</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

      {/* Main Grid / Explore Showcase */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        
        {/* Section Title */}
        <div className="flex items-center justify-between mb-8 border-b-2 border-brand-black pb-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-brand-black flex items-center gap-2">
            <span>Explore Showcase</span>
          </h2>
          {selectedCategory && (
            <span className="text-xs font-black uppercase tracking-wider text-brand-rose">
              Filtered: {selectedCategory}
            </span>
          )}
        </div>

        {/* States Handler */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-brand-black gap-4">
            <Loader2 size={32} className="animate-spin text-brand-rose" />
            <p className="text-xs font-black uppercase tracking-wider">Syncing gallery directory...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto gap-4 border-2 border-brand-black bg-zinc-50 shadow-[6px_6px_0px_0px_rgba(204,49,137,1)] p-6 rounded-none">
            <AlertCircle size={32} className="text-brand-rose" />
            <h3 className="text-sm font-black uppercase text-brand-black">Network Offline</h3>
            <p className="text-xs text-brand-black font-semibold">
              {error}
            </p>
            <button
              onClick={() => loadProjects()}
              className="awwwards-btn-secondary px-6 py-2 text-xs"
            >
              Retry Connection
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-brand-black bg-zinc-50 p-8 max-w-lg mx-auto rounded-none">
            <p className="text-xs font-black uppercase text-brand-black tracking-wider mb-4">
              No developer projects found in directory.
            </p>
            {user && (
              <button
                onClick={() => openManageModal("add")}
                className="awwwards-btn-primary px-5 py-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(24,22,22,1)]"
              >
                Submit Project
              </button>
            )}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-brand-black bg-zinc-50 p-8 max-w-lg mx-auto rounded-none">
            <p className="text-xs font-black uppercase text-brand-black tracking-wider mb-4">
              No projects match your search or filter.
            </p>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProjects.map((proj) => (
              <ProjectCard
                key={proj.project_id}
                project={proj}
                onClick={() => setSelectedProject(proj)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-brand-black py-8 bg-zinc-50 text-center text-xs font-black uppercase tracking-widest text-brand-black">
        <p>© 2026 Lattice. Designed for developers. Built with Go & Next.js.</p>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialTab={authTab}
      />

      <ProjectDetailModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onViewProfile={openProfileModal}
      />

      {profileModalData && (
        <PublicProfileModal
          email={profileModalData.email}
          name={profileModalData.name}
          avatarUrl={profileModalData.avatarUrl}
          userId={profileModalData.userId}
          onClose={closeProfileModal}
          onViewProject={(proj) => {
            closeProfileModal();
            setSelectedProject(proj);
          }}
        />
      )}

      <ProjectManageModal
        isOpen={manageOpen}
        onClose={() => {
          setManageOpen(false);
        }}
        onProjectsChanged={() => {
          window.location.reload();
        }}
        initialTab={manageTab}
      />
    </div>
  );
}
