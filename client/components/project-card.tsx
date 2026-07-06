"use client";

import React from "react";
import { Project } from "../lib/api";
import { ExternalLink, User } from "lucide-react";

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

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="awwwards-card rounded-none overflow-hidden cursor-pointer flex flex-col group"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-50 border-b-2 border-brand-black">
        <img
          src={project.image_url}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />

        {/* Hover Action Bar */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="px-2.5 py-1 bg-brand-rose border-2 border-brand-black text-white text-[9px] font-black uppercase tracking-wider rounded-none">
            {project.category}
          </span>
          <div className="flex gap-2 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            {project.github_link && (
              <a
                href={project.github_link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white border-2 border-brand-black hover:bg-brand-rose hover:text-white rounded-none text-brand-black transition-colors shadow-[2px_2px_0px_0px_rgba(24,22,22,1)]"
                title="Codebase"
              >
                <GithubIcon className="w-3.5 h-3.5" />
              </a>
            )}
            {project.live_demo_link && (
              <a
                href={project.live_demo_link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white border-2 border-brand-black hover:bg-brand-rose hover:text-white rounded-none text-brand-black transition-colors shadow-[2px_2px_0px_0px_rgba(24,22,22,1)]"
                title="Live Website"
              >
                <ExternalLink size={14} className="stroke-[2.5]" />
              </a>
            )}
          </div>
        </div>

        {/* Category Pill (Non-hover static) */}
        <span className="absolute top-4 right-4 px-2.5 py-1 bg-white border-2 border-brand-black text-brand-black text-[9px] font-black uppercase tracking-wider rounded-none group-hover:opacity-0 transition-opacity duration-150">
          {project.category}
        </span>
      </div>

      {/* Info Bar */}
      <div className="p-5 flex flex-col justify-between flex-1 gap-4 bg-white">
        <div className="space-y-1">
          <h3 className="text-base font-black text-brand-black tracking-tight uppercase line-clamp-1 group-hover:text-brand-rose transition-colors">
            {project.title}
          </h3>
          <p className="text-xs text-brand-black line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        </div>

        <div className="flex items-center justify-between border-t-2 border-brand-black pt-3.5">
          <div className="flex items-center gap-2">
            {project.user?.avatar_url ? (
              <img
                src={project.user.avatar_url}
                alt={project.user.name}
                className="w-6 h-6 object-cover border-2 border-brand-black rounded-none"
              />
            ) : (
              <div className="w-6 h-6 bg-brand-pink border-2 border-brand-black rounded-none flex items-center justify-center">
                <User size={10} className="text-white" />
              </div>
            )}
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-black truncate max-w-[120px]">
              {project.user?.name || "Developer"}
            </span>
          </div>
          
          <span className="text-[9px] font-black uppercase tracking-widest text-brand-black">
            View details ↗
          </span>
        </div>
      </div>
    </div>
  );
};
