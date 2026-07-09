"use client";

import React, { useState, useEffect, useMemo, use } from "react";
import { api, Project, PublicProfile } from "../../../lib/api";
import { USER_ID_TO_EMAIL } from "../../../lib/profile-details";
import { Header } from "../../../components/header";
import { ProjectCard } from "../../../components/project-card";
import { ProjectDetailModal } from "../../../components/project-detail-modal";
import { AuthModal } from "../../../components/auth-modal";
import { ProjectManageModal } from "../../../components/project-manage-modal";
import { useAuth } from "../../../context/auth-context";
import { useToast } from "../../../context/toast-context";
import { Loader2, User, ChevronLeft, ArrowRight, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ email?: string; name?: string }>;
}

export default function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);
  
  const userId = resolvedParams.userId;
  const emailQuery = resolvedSearchParams.email;
  const nameQuery = resolvedSearchParams.name;

  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();

  // Profile and projects state
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State (Local to profile page)
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Modal States
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [manageOpen, setManageOpen] = useState(false);
  const [manageTab, setManageTab] = useState<"projects" | "add" | "profile">("projects");

  // Determine email to use
  const targetEmail = emailQuery || (userId ? USER_ID_TO_EMAIL[userId] : undefined);

  const fetchProfileAndProjects = async () => {
    if (!targetEmail) {
      setError("No email address provided for this user profile.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch public profile and user's projects using the APIs
      const [profileRes, projectsRes] = await Promise.all([
        api.getPublicProfile(targetEmail),
        api.getProjectsByUserEmail(targetEmail),
      ]);

      if (profileRes.success && profileRes.data) {
        setProfile(profileRes.data);
      } else {
        // Fallback to query params or basic structured details
        setProfile({
          name: nameQuery || targetEmail.split("@")[0],
          email: targetEmail,
          avatar: ""
        });
      }

      if (projectsRes.success && projectsRes.data) {
        // Strictly filter projects by this user's user_id or email to guarantee no data merging
        const filtered = projectsRes.data.filter(
          (proj) => proj.user_id === userId || proj.user?.email === targetEmail
        );
        setUserProjects(filtered);
      } else {
        setUserProjects([]);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to load user profile or projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndProjects();
  }, [targetEmail, userId]);

  const openAuthModal = (tab: "login" | "signup") => {
    setAuthTab(tab);
    setAuthOpen(true);
  };

  const openManageModal = (tab: "projects" | "add" | "profile") => {
    setManageTab(tab);
    setManageOpen(true);
  };

  // Filter projects locally by search and category
  const filteredProjects = useMemo(() => userProjects.filter((proj) => {
    if (selectedCategory && proj.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return proj.title.toLowerCase().includes(term) || proj.description.toLowerCase().includes(term);
    }
    return true;
  }), [userProjects, searchTerm, selectedCategory]);

  const displayName = profile?.name || nameQuery || targetEmail?.split("@")[0] || "Unknown";
  const displayEmail = profile?.email || targetEmail || "";
  const displayAvatar = profile?.avatar || null;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col min-h-screen bg-white text-brand-black selection:bg-brand-rose selection:text-white">
      <Header
        onSearch={setSearchTerm}
        onSelectCategory={setSelectedCategory}
        selectedCategory={selectedCategory}
        onOpenAuth={openAuthModal}
        onOpenManage={openManageModal}
        projects={userProjects}
      />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 mb-8 text-xs font-black uppercase tracking-wider text-brand-black hover:text-brand-rose transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} className="stroke-[2.5]" />
          <span>Back to Index</span>
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 size={32} className="animate-spin text-brand-rose" />
            <p className="text-xs font-black uppercase tracking-wider">Syncing profile data...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto gap-4 border-2 border-brand-black bg-zinc-50 shadow-[6px_6px_0px_0px_rgba(204,49,137,1)] p-6 rounded-none">
            <p className="text-xs text-brand-black font-semibold">{error}</p>
            <button
              onClick={() => fetchProfileAndProjects()}
              className="awwwards-btn-secondary px-6 py-2 text-xs"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Profile Info Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 border-2 border-brand-black p-5 sm:p-6 shadow-[6px_6px_0px_0px_rgba(24,22,22,1)] bg-zinc-50">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={displayName}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover border-2 border-brand-black rounded-none flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-brand-rose border-2 border-brand-black flex items-center justify-center text-2xl sm:text-3xl font-black text-white uppercase flex-shrink-0">
                  {initial}
                </div>
              )}
              <div className="space-y-2 min-w-0">
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-brand-black break-words">
                  {displayName}
                </h1>
                <div className="flex items-center gap-1.5">
                  <Mail size={13} className="text-brand-rose stroke-[2.5] flex-shrink-0" />
                  <span className="text-xs font-semibold text-zinc-600 break-all">
                    {displayEmail}
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white border-2 border-brand-black">
                  <span className="text-[9px] font-black uppercase tracking-widest text-brand-black">
                    {userProjects.length} Project{userProjects.length !== 1 ? "s" : ""} Published
                  </span>
                </div>
              </div>
            </div>

            {/* Showcase Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b-2 border-brand-black pb-4">
                <h2 className="text-sm font-black uppercase tracking-wider text-brand-black">
                  Projects by {displayName}
                </h2>
                {selectedCategory && (
                  <span className="text-xs font-black uppercase tracking-wider text-brand-rose">
                    Category: {selectedCategory}
                  </span>
                )}
              </div>

              {filteredProjects.length === 0 ? (
                <div className="border-2 border-dashed border-zinc-300 bg-zinc-50 p-12 text-center max-w-lg mx-auto rounded-none">
                  <p className="text-xs font-black uppercase text-zinc-500 tracking-wider">
                    No matching projects found.
                  </p>
                </div>
              ) : (
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
            </div>
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
      />

      <ProjectManageModal
        isOpen={manageOpen}
        onClose={() => {
          setManageOpen(false);
        }}
        onProjectsChanged={() => {
          window.location.reload(); // Hard automatic refresh
        }}
        initialTab={manageTab}
      />
    </div>
  );
}
