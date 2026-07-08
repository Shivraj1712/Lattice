"use client";

import React, { useEffect, useState, useCallback } from "react";
import { api, PublicProfile, Project } from "../lib/api";
import { X, ExternalLink, Calendar, Mail, User } from "lucide-react";

const GithubIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

interface PublicProfileModalProps {
  email: string | null;
  name: string;
  avatarUrl: string | null;
  onClose: () => void;
  onViewProject?: (project: Project) => void;
}

export const PublicProfileModal: React.FC<PublicProfileModalProps> = ({
  email,
  name,
  avatarUrl,
  onClose,
  onViewProject,
}) => {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const [profileRes, projectsRes] = await Promise.all([
        api.getPublicProfile(email),
        api.getProjectsByUserEmail(email),
      ]);
      if (profileRes.data) setProfile(profileRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
    } catch {
      setError("Could not load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const displayName = profile?.name || name || "Shivraj";
  const displayEmail = profile?.email || email || "shivrajmaharaul688@gmail.com";
  const displayAvatar = profile?.avatar || avatarUrl;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brand-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-2 border-brand-black shadow-[8px_8px_0px_0px_rgba(24,22,22,1)] flex flex-col rounded-none">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-brand-black sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <User size={14} className="text-brand-black stroke-[2.5]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-black">
              Public Profile // Read Only
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 border-2 border-transparent hover:border-brand-black transition-colors cursor-pointer"
            aria-label="Close profile"
          >
            <X size={20} className="text-brand-black" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 space-y-8">

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-8 h-8 border-4 border-brand-black border-t-brand-rose animate-spin rounded-full" />
              <p className="text-xs font-black uppercase tracking-wider text-brand-black">
                Loading profile...
              </p>
            </div>
          ) : error ? (
            <div className="border-2 border-brand-rose bg-rose-50 p-6 text-center space-y-2">
              <p className="text-xs font-black uppercase tracking-wider text-brand-rose">{error}</p>
              <button
                onClick={loadProfile}
                className="mt-2 text-[10px] font-black uppercase tracking-wider text-brand-black underline cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Profile Hero */}
              <div className="flex items-center gap-5 border-2 border-brand-black p-5 shadow-[4px_4px_0px_0px_rgba(24,22,22,1)] bg-zinc-50">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={displayName}
                    className="w-16 h-16 object-cover border-2 border-brand-black rounded-none flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-brand-rose border-2 border-brand-black flex items-center justify-center text-2xl font-black text-white uppercase flex-shrink-0">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="space-y-1.5 min-w-0">
                  <h2 className="text-xl font-black uppercase tracking-tight text-brand-black truncate">
                    {displayName}
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <Mail size={11} className="text-brand-rose stroke-[2.5] flex-shrink-0" />
                    <span className="text-xs font-semibold text-brand-black truncate">
                      {displayEmail}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white border-2 border-brand-black mt-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-brand-black">
                      {projects.length} Project{projects.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* Read-only notice */}
              <div className="flex items-center gap-2 border-l-4 border-brand-rose pl-3 py-1 bg-rose-50">
                <span className="text-[9px] font-black uppercase tracking-widest text-brand-rose">
                  View only — you cannot edit another user&apos;s profile or projects
                </span>
              </div>

              {/* Projects list */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-brand-black border-b-2 border-brand-black pb-2">
                  Projects by {displayName} // {projects.length}
                </h3>

                {projects.length === 0 ? (
                  <div className="border-2 border-brand-black p-8 text-center bg-zinc-50">
                    <p className="text-xs font-black uppercase tracking-wider text-brand-black">
                      No public projects yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.map((proj) => (
                      <div
                        key={proj.project_id}
                        className="border-2 border-brand-black p-4 bg-white hover:bg-zinc-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-black uppercase tracking-tight text-brand-black truncate">
                                {proj.title}
                              </h4>
                              {proj.category && (
                                <span className="px-2 py-0.5 bg-brand-black text-white text-[9px] font-black uppercase tracking-wider flex-shrink-0">
                                  {proj.category}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-brand-black font-semibold line-clamp-2 leading-relaxed">
                              {proj.description}
                            </p>
                            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-brand-black">
                              <Calendar size={10} className="flex-shrink-0" />
                              <span>{new Date(proj.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {proj.image_url && (
                            <div className="w-16 h-16 border-2 border-brand-black overflow-hidden flex-shrink-0 bg-zinc-100">
                              <img
                                src={proj.image_url}
                                alt={proj.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-brand-black flex-wrap">
                          {onViewProject && (
                            <button
                              onClick={() => onViewProject(proj)}
                              className="text-[9px] font-black uppercase tracking-wider text-brand-black hover:text-brand-rose transition-colors cursor-pointer underline"
                            >
                              View Details ↗
                            </button>
                          )}
                          {proj.github_link && (
                            <a
                              href={proj.github_link.startsWith("http") ? proj.github_link : `https://${proj.github_link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-brand-black hover:text-brand-rose transition-colors"
                            >
                              <GithubIcon className="w-3 h-3" />
                              <span>Repo</span>
                            </a>
                          )}
                          {proj.live_demo_link && (
                            <a
                              href={proj.live_demo_link.startsWith("http") ? proj.live_demo_link : `https://${proj.live_demo_link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-brand-rose hover:underline transition-colors"
                            >
                              <ExternalLink size={10} />
                              <span>Live</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
