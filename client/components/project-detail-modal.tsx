"use client";

import React, { useEffect, useState } from "react";
import { api, Project, PublicProfile } from "../lib/api";
import { X, ExternalLink, Calendar, ChevronRight } from "lucide-react";

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

interface ProjectDetailModalProps {
  project: Project | null;
  onClose: () => void;
  onViewProfile?: (email: string, name: string, avatarUrl: string | null) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
  onViewProfile,
}) => {
  const [ownerProfile, setOwnerProfile] = useState<PublicProfile | null>(null);

  // Whenever the project changes, fetch the owner's public profile to get the real avatar
  useEffect(() => {
    setOwnerProfile(null);
    if (!project) return;

    const email = project.user?.email || "shivrajmaharaul688@gmail.com";
    api
      .getPublicProfile(email)
      .then((res) => {
        if (res.data) setOwnerProfile(res.data);
      })
      .catch(() => {
        // silently fail — fall back to project.user fields
      });
  }, [project?.project_id]);

  if (!project) return null;

  const formattedDate = new Date(project.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Resolved owner info: prefer freshly-fetched profile, then project.user fields, then hardcoded fallback
  const ownerName = ownerProfile?.name || project.user?.name || "Shivraj";
  const ownerEmail = ownerProfile?.email || project.user?.email || "shivrajmaharaul688@gmail.com";
  const ownerAvatar = ownerProfile?.avatar || project.user?.avatar_url || null;

  const handleViewProfile = () => {
    onViewProfile?.(ownerEmail, ownerName, ownerAvatar);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 transition-all duration-300">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white border-2 border-brand-black rounded-none shadow-[8px_8px_0px_0px_rgba(24,22,22,1)] flex flex-col scrollbar-thin">

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-brand-black sticky top-0 bg-white z-10">
          <span className="px-3 py-1 bg-brand-black text-white text-xs font-black uppercase tracking-wider border-2 border-brand-black rounded-none">
            {project.category} // Project Details
          </span>
          <button
            onClick={onClose}
            className="p-1 border-2 border-transparent hover:border-brand-black transition-colors cursor-pointer"
          >
            <X size={20} className="text-brand-black" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 space-y-6 bg-white">

          {/* Main Cover Image */}
          <div className="relative aspect-[16/9] w-full overflow-hidden border-2 border-brand-black rounded-none bg-zinc-50">
            <img
              src={project.image_url}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-brand-black">
            {project.title}
          </h2>

          {/* Author Row — avatar+info on left, View Profile button on right */}
          <div className="flex items-center justify-between gap-4 border-2 border-brand-black p-3 bg-zinc-50">
            {/* Left: avatar + name + email */}
            <div className="flex items-center gap-3 min-w-0">
              {ownerAvatar ? (
                <img
                  src={ownerAvatar}
                  alt={ownerName}
                  className="w-10 h-10 object-cover border-2 border-brand-black rounded-none flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 bg-brand-rose border-2 border-brand-black flex items-center justify-center text-sm font-black text-white uppercase flex-shrink-0">
                  {ownerName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-black uppercase text-brand-black truncate">{ownerName}</p>
                <p className="text-xs text-brand-black font-semibold truncate">{ownerEmail}</p>
              </div>
            </div>

            {/* Right: View Profile button */}
            <button
              onClick={handleViewProfile}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 border-2 border-brand-black bg-white hover:bg-brand-black hover:text-white text-brand-black text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(24,22,22,1)] hover:shadow-none"
            >
              <span>View Profile</span>
              <ChevronRight size={12} className="stroke-[2.5]" />
            </button>
          </div>

          {/* Links Block */}
          <div className="flex items-center gap-3 flex-wrap">
            {project.github_link && (
              <a
                href={project.github_link.startsWith("http") ? project.github_link : `https://${project.github_link}`}
                target="_blank"
                rel="noopener noreferrer"
                className="awwwards-btn-secondary px-5 py-3 rounded-none text-xs flex items-center gap-1.5"
              >
                <GithubIcon className="text-brand-black" />
                <span>Repository</span>
              </a>
            )}
            {project.live_demo_link && (
              <a
                href={project.live_demo_link.startsWith("http") ? project.live_demo_link : `https://${project.live_demo_link}`}
                target="_blank"
                rel="noopener noreferrer"
                className="awwwards-btn-primary px-5 py-3 rounded-none text-xs flex items-center gap-1.5"
              >
                <ExternalLink size={15} />
                <span>Live Project</span>
              </a>
            )}
          </div>

          <hr className="border-t-2 border-brand-black" />

          {/* Description Block */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-brand-black">Project Description //</h3>
            <p className="text-brand-black leading-relaxed text-sm font-semibold whitespace-pre-wrap">
              {project.description}
            </p>
          </div>

          <hr className="border-t-2 border-brand-black" />

          {/* Footer Metadata */}
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-brand-black">
            <Calendar size={14} />
            <span>Published on {formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
