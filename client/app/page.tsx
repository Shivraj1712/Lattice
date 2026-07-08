"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/auth-context";
import { api, Project } from "../lib/api";
import { Header } from "../components/header";
import { ProjectCard } from "../components/project-card";
import { ProjectDetailModal } from "../components/project-detail-modal";
import { ProjectManageModal } from "../components/project-manage-modal";
import { AuthModal } from "../components/auth-modal";
import { Loader2, Sparkles, AlertCircle, ArrowRight } from "lucide-react";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  
  // Projects State
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Modal States
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  
  const [manageOpen, setManageOpen] = useState(false);
  const [manageTab, setManageTab] = useState<"projects" | "add" | "profile">("projects");

  // Fetch projects on load
  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getAllProjects();
      if (response.success && response.data) {
        setProjects(response.data);
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

  // Safeguard: Close Auth Modal if user is logged in
  useEffect(() => {
    if (user && authOpen) {
      setAuthOpen(false);
    }
  }, [user, authOpen]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white text-brand-black flex flex-col items-center justify-center gap-4 select-none">
        <div className="w-10 h-10 border-4 border-brand-black border-t-brand-rose animate-spin rounded-none shadow-[3px_3px_0px_0px_rgba(24,22,22,1)]" />
        <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Syncing Lattice Session...</p>
      </div>
    );
  }

  // Compute filtered projects in memory
  const filteredProjects = projects.filter((proj) => {
    if (selectedCategory && proj.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        proj.title.toLowerCase().includes(term) ||
        proj.description.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const openAuthModal = (tab: "login" | "signup") => {
    setAuthTab(tab);
    setAuthOpen(true);
  };

  const openManageModal = (tab: "projects" | "add" | "profile") => {
    setManageTab(tab);
    setManageOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-brand-black selection:bg-brand-rose selection:text-white">
      <Header
        onSearch={setSearchTerm}
        onSelectCategory={setSelectedCategory}
        selectedCategory={selectedCategory}
        onOpenAuth={openAuthModal}
        onOpenManage={openManageModal}
        projects={projects}
      />

      {/* Brutalist Hero Banner Section (Reduced padding) */}
      <section className="relative py-8 px-4 md:py-12 md:px-8 bg-zinc-50 border-b-4 border-brand-black">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column - Copy & Actions */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-brand-rose border-2 border-brand-black text-white text-[10px] font-black uppercase tracking-wider rounded-none">
              <Sparkles size={11} className="stroke-[2.5]" />
              <span>Project Showcase // Live</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black uppercase tracking-tight leading-[0.95] text-brand-black">
              Explore
              <br />
              <span className="bg-gradient-to-r from-brand-rose to-brand-rose bg-clip-text text-transparent">
                Developer code
              </span>
              <br />
              At Scale.
            </h1>

            <p className="text-xs sm:text-sm text-brand-black font-semibold leading-relaxed max-w-xl uppercase tracking-wide">
              Lattice is a minimalist gallery index for full-stack websites, codebase reviews, and backend APIs. Share your code repositories, deploy live preview links, and inspect developer packages.
            </p>

            <div className="flex items-center gap-3 pt-2">
              {user ? (
                <button
                  onClick={() => openManageModal("add")}
                  className="awwwards-btn-primary px-6 py-3 text-xs flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(24,22,22,1)]"
                >
                  <span>Submit Project</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={() => openAuthModal("signup")}
                  className="awwwards-btn-primary px-6 py-3 text-xs flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(24,22,22,1)]"
                >
                  <span>Create Workspace</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>

            {/* Brutalist dividers statistics grid */}
            <div className="grid grid-cols-3 border-2 border-brand-black divide-x-2 divide-brand-black bg-white rounded-none shadow-[4px_4px_0px_0px_rgba(24,22,22,1)] p-4 max-w-md">
              <div>
                <p className="text-xl font-black text-brand-black">{projects.length}</p>
                <p className="text-[9px] text-brand-black font-black uppercase tracking-wider">Projects</p>
              </div>
              <div className="pl-4">
                <p className="text-xl font-black text-brand-black">
                  {new Set(projects.map((p) => p.user_id)).size}
                </p>
                <p className="text-[9px] text-brand-black font-black uppercase tracking-wider">Creators</p>
              </div>
              <div className="pl-4">
                <p className="text-xl font-black text-brand-black">
                  {projects.filter((p) => p.live_demo_link).length}
                </p>
                <p className="text-[9px] text-brand-black font-black uppercase tracking-wider">Live Demos</p>
              </div>
            </div>
          </div>

          {/* Right Column - Increased size Hero card containing complete project info */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end w-full">
            <div className="w-full max-w-[480px] bg-white border-2 border-brand-black rounded-none shadow-[8px_8px_0px_0px_rgba(24,22,22,1)] p-4 sm:p-6 space-y-4 sm:space-y-6 flex flex-col justify-between group overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-brand-black pb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-black">
                    Featured Project Review // 01
                  </span>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-rose opacity-75 border border-brand-black"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-rose border border-brand-black"></span>
                  </span>
                </div>

                <div className="space-y-2.5">
                  <h3 className="text-xl font-black uppercase tracking-tight text-brand-black group-hover:text-brand-rose transition-colors truncate">
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
                  <span className="font-bold truncate text-right uppercase">
                    {projects[0] ? projects[0].title : "LATTICE PORTAL CORE"}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2 overflow-hidden border-t border-brand-black pt-1.5">
                  <span>REPOSITORY:</span>
                  <span className="font-bold truncate text-right uppercase">
                    {projects[0] ? projects[0].github_link.replace("https://", "").replace("http://", "") : "GITHUB.COM/SHIVRAJ/LATTICE"}
                  </span>
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
                  <span className="font-bold text-brand-rose truncate text-right uppercase">
                    {projects[0] ? projects[0].live_demo_link.replace("https://", "").replace("http://", "") : "LATTICE-DEMO.VERCEL.APP"}
                  </span>
                </div>
              </div>

              {/* Author footer */}
              <div className="flex items-center justify-between border-t-2 border-brand-black pt-4">
                <div className="flex items-center gap-2">
                  {projects[0]?.user?.avatar_url ? (
                    <img
                      src={projects[0].user.avatar_url}
                      alt={projects[0].user.name}
                      className="w-6 h-6 object-cover border-2 border-brand-black"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-brand-black border-2 border-brand-black flex items-center justify-center text-[10px] font-black uppercase text-white">
                      {projects[0] ? projects[0].user?.name.charAt(0).toUpperCase() : "S"}
                    </div>
                  )}
                  <span className="text-xs font-black uppercase tracking-wider text-brand-black truncate max-w-[150px]">
                    {projects[0] ? projects[0].user?.name : "Shivraj"}
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-brand-black">Author</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Main Grid / Explore Showcase */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        
        {/* Section Title */}
        <div className="flex items-center justify-between mb-8 border-b-2 border-brand-black pb-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-brand-black flex items-center gap-2">
            <span>Explore Showcase //</span>
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
              onClick={loadProjects}
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
        <p>© 2026 Lattice // Designed for developers. Built with Go & Next.js.</p>
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
      />

      <ProjectManageModal
        isOpen={manageOpen}
        onClose={() => {
          setManageOpen(false);
          loadProjects(); // Reload projects list in case any updates/deletes happened
        }}
        initialTab={manageTab}
      />
    </div>
  );
}
