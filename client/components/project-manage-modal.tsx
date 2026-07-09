"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/auth-context";
import { useToast } from "../context/toast-context";
import { api, Project } from "../lib/api";
import {
  X,
  User as UserIcon,
  FolderKanban,
  Plus,
  Settings,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Loader2,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

interface ProjectManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "projects" | "add" | "profile";
  onProjectsChanged?: () => void;
}

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

const CATEGORIES = ["Frontend", "Backend", "Fullstack", "Design", "AI/ML", "Mobile", "Other"];

export const ProjectManageModal: React.FC<ProjectManageModalProps> = ({
  isOpen,
  onClose,
  initialTab = "projects",
  onProjectsChanged,
}) => {
  const { user, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"projects" | "add" | "profile">(initialTab);
  const toast = useToast();
  
  // Local lists
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [projectDetailsLoading, setProjectDetailsLoading] = useState(false);
  const [projectImageLoading, setProjectImageLoading] = useState(false);
  const [deleteProjectLoading, setDeleteProjectLoading] = useState<string | null>(null);

  // Sub-modal open states
  const [projectImageModal, setProjectImageModal] = useState<Project | null>(null);
  const [projectDetailsModal, setProjectDetailsModal] = useState<Project | null>(null);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [profileDetailsModalOpen, setProfileDetailsModalOpen] = useState(false);

  // Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const requestConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form States (Add Project)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [githubLink, setGithubLink] = useState("");
  const [liveDemoLink, setLiveDemoLink] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Form States (Edit Project Details)
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editGithubLink, setEditGithubLink] = useState("");
  const [editLiveDemoLink, setEditLiveDemoLink] = useState("");

  // Profile Form States
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profilePassword, setProfilePassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const projectImageEditRef = useRef<HTMLInputElement>(null);
  const avatarModalInputRef = useRef<HTMLInputElement>(null);
  const projectImageModalRef = useRef<HTMLInputElement>(null);

  // Sync profile form when user context loads
  useEffect(() => {
    if (user) {
      setProfileName(user.name);
    }
  }, [user]);

  // Load User Projects
  const fetchMyProjects = async () => {
    if (!user) return;
    setProjectsLoading(true);
    try {
      const response = await api.getAuthUserProjects();
      if (response.success && response.data) {
        setMyProjects(response.data);
      }
    } catch (err) {
      console.error("Failed to load user projects", err);
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMyProjects();
      setEditingProject(null);
    }
  }, [isOpen, user]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  // Clear messages helper
  const resetStatus = () => {
    // No-op (handled by global toasts)
  };

  // --- Handlers ---

  // Create Project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    resetStatus();
    if (!imageFile) {
      toast.error("Please select a cover image");
      return;
    }
    setActionLoading(true);

    try {
      await api.createProject({
        title,
        description,
        github_link: githubLink,
        live_demo_link: liveDemoLink,
        category,
        image: imageFile,
      });
      toast.success("Project created successfully!");
      // Reset fields
      setTitle("");
      setDescription("");
      setCategory(CATEGORIES[0]);
      setGithubLink("");
      setLiveDemoLink("");
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Reload projects list and switch to list tab
      await fetchMyProjects();
      if (onProjectsChanged) onProjectsChanged();
      setActiveTab("projects");
    } catch (err: any) {
      toast.error(err.message || "Failed to create project");
    } finally {
      setActionLoading(false);
    }
  };

  // Edit Project (Init)
  const startEditProject = (proj: Project) => {
    setEditingProject(proj);
    setEditTitle(proj.title);
    setEditDescription(proj.description);
    setEditCategory(proj.category || CATEGORIES[0]);
    setEditGithubLink(proj.github_link);
    setEditLiveDemoLink(proj.live_demo_link);
    resetStatus();
  };

  // Open Project Details Modal
  const openProjectDetailsModal = (proj: Project) => {
    setProjectDetailsModal(proj);
    setEditTitle(proj.title);
    setEditDescription(proj.description);
    setEditCategory(proj.category || CATEGORIES[0]);
    setEditGithubLink(proj.github_link);
    setEditLiveDemoLink(proj.live_demo_link);
  };

  // Save Project Details Edit (via modal)
  const handleSaveProjectDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectDetailsModal) return;
    resetStatus();
    setProjectDetailsLoading(true);

    try {
      await api.updateProjectDetails(projectDetailsModal.project_id, {
        title: editTitle,
        description: editDescription,
        category: editCategory,
        github_link: editGithubLink,
        live_demo_link: editLiveDemoLink,
      });
      toast.success("Project details updated!");
      setProjectDetailsModal(null);
      setEditingProject(null);
      await fetchMyProjects();
      if (onProjectsChanged) onProjectsChanged();
    } catch (err: any) {
      toast.error(err.message || "Failed to update project");
    } finally {
      setProjectDetailsLoading(false);
    }
  };

  // Upload Project Cover Image (via modal)
  const handleUploadProjectImage = async (e: React.ChangeEvent<HTMLInputElement>, proj?: Project) => {
    const target = proj || projectImageModal;
    if (!target || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    resetStatus();
    setProjectImageLoading(true);

    try {
      await api.updateProjectImage(target.project_id, file);
      toast.success("Project cover image updated!");
      if (projectImageEditRef.current) projectImageEditRef.current.value = "";
      if (projectImageModalRef.current) projectImageModalRef.current.value = "";
      setProjectImageModal(null);
      await fetchMyProjects();
      if (onProjectsChanged) onProjectsChanged();
    } catch (err: any) {
      toast.error(err.message || "Failed to update project image");
    } finally {
      setProjectImageLoading(false);
    }
  };

  // Delete Project
  const handleDeleteProject = async (projectId: string) => {
    requestConfirm(
      "Delete Project",
      "Are you sure you want to delete this project? This action is permanent and cannot be undone.",
      async () => {
        resetStatus();
        setDeleteProjectLoading(projectId);
        try {
          await api.deleteProject(projectId);
          toast.success("Project deleted.");
          await fetchMyProjects();
          if (onProjectsChanged) onProjectsChanged();
        } catch (err: any) {
          toast.error(err.message || "Failed to delete project");
        } finally {
          setDeleteProjectLoading(null);
        }
      }
    );
  };

  // Update Profile Name/Password
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    resetStatus();
    setProfileLoading(true);

    try {
      const payload: any = { name: profileName };
      if (profilePassword) {
        if (profilePassword.length < 8) {
          throw new Error("Password must be at least 8 characters");
        }
        payload.password = profilePassword;
      }
      await api.updateUserDetails(payload);
      toast.success("Account details updated successfully!");
      setProfilePassword("");
      await refreshUser();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile details");
    } finally {
      setProfileLoading(false);
    }
  };

  // Upload Profile Avatar
  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setAvatarFile(file);
    resetStatus();
    setAvatarLoading(true);

    try {
      await api.updateUserImage(file);
      toast.success("Avatar updated successfully!");
      setAvatarFile(null);
      await refreshUser();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar");
    } finally {
      setAvatarLoading(false);
    }
  };

  // Delete User Account
  const handleDeleteAccount = async () => {
    requestConfirm(
      "Delete Account",
      "WARNING: Deleting your account will remove your profile and ALL your shared projects. This cannot be undone. Do you wish to continue?",
      async () => {
        resetStatus();
        setDeleteAccountLoading(true);
        try {
          await api.deleteUser();
          onClose();
          await logout();
          toast.success("Account deleted successfully.");
          window.location.reload();
        } catch (err: any) {
          toast.error(err.message || "Failed to delete user account");
        } finally {
          setDeleteAccountLoading(false);
        }
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-brand-black/60 transition-all duration-300 overflow-y-auto">
      <div className="relative w-full sm:max-w-4xl my-auto h-[92dvh] sm:h-[85vh] max-h-[calc(100vh-2rem)] bg-white border-0 sm:border-2 sm:border-t-2 border-brand-black rounded-t-none sm:rounded-none shadow-[0_-4px_0_0_rgba(24,22,22,1)] sm:shadow-[8px_8px_0px_0px_rgba(24,22,22,1)] flex flex-col md:flex-row overflow-hidden animate-modal-in">
        
        {/* Sidebar / bottom tabs on mobile */}
        <div className="flex md:flex-col w-full md:w-64 bg-zinc-50 border-b-2 md:border-b-0 md:border-r-2 border-brand-black md:justify-between p-3 md:p-6 overflow-x-auto flex-shrink-0">
          <div className="flex md:flex-col gap-1.5 md:gap-6 min-w-max md:min-w-0">
            <div>
              <h2 className="text-xl font-black uppercase text-brand-black tracking-tight">
                Dashboard
              </h2>
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black mt-1">
                Lattice Studio
              </p>
            </div>

            <nav className="flex md:flex-col gap-1 md:space-y-2">
              <button
                onClick={() => {
                  setActiveTab("projects");
                  setEditingProject(null);
                  resetStatus();
                }}
                className={`flex items-center gap-2 md:gap-3 w-full px-2.5 py-2 md:px-4 md:py-3 text-[10px] md:text-xs font-black uppercase tracking-wider border-2 border-transparent transition-all cursor-pointer rounded-none ${
                  activeTab === "projects"
                    ? "bg-brand-black text-white border-brand-black shadow-[2px_2px_0px_0px_rgba(24,22,22,1)]"
                    : "text-zinc-600 hover:text-brand-black hover:bg-zinc-100"
                }`}
              >
                <FolderKanban size={15} />
                <span>My Projects</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("add");
                  resetStatus();
                }}
                className={`flex items-center gap-2 md:gap-3 w-full px-2.5 py-2 md:px-4 md:py-3 text-[10px] md:text-xs font-black uppercase tracking-wider border-2 border-transparent transition-all cursor-pointer rounded-none ${
                  activeTab === "add"
                    ? "bg-brand-black text-white border-brand-black shadow-[2px_2px_0px_0px_rgba(24,22,22,1)]"
                    : "text-zinc-600 hover:text-brand-black hover:bg-zinc-100"
                }`}
              >
                <Plus size={15} />
                <span>Add Project</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("profile");
                  resetStatus();
                }}
                className={`flex items-center gap-2 md:gap-3 w-full px-2.5 py-2 md:px-4 md:py-3 text-[10px] md:text-xs font-black uppercase tracking-wider border-2 border-transparent transition-all cursor-pointer rounded-none ${
                  activeTab === "profile"
                    ? "bg-brand-black text-white border-brand-black shadow-[2px_2px_0px_0px_rgba(24,22,22,1)]"
                    : "text-zinc-600 hover:text-brand-black hover:bg-zinc-100"
                }`}
              >
                <Settings size={15} />
                <span>Settings</span>
              </button>
            </nav>
          </div>

          <button
            onClick={onClose}
            className="hidden md:flex awwwards-btn-secondary w-full py-2.5 rounded-none text-xs items-center justify-center gap-1.5 cursor-pointer shadow-[3px_3px_0px_0px_rgba(24,22,22,1)]"
          >
            <span>Close Console</span>
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-white">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b-2 border-brand-black bg-zinc-50 sticky top-0 z-10">
            <h3 className="text-sm font-black uppercase tracking-wider text-brand-black flex items-center gap-2">
              {activeTab === "projects" && (editingProject ? "Edit Project Details" : "Project Directory")}
              {activeTab === "add" && "Submit Project"}
              {activeTab === "profile" && "Lattice Identity Manager"}
              {actionLoading && <Loader2 size={15} className="animate-spin text-brand-rose" />}
            </h3>
            <button
              onClick={onClose}
              className="p-1 border-2 border-transparent hover:border-brand-black transition-colors cursor-pointer"
            >
              <X size={18} className="text-brand-black" />
            </button>
          </div>

          {/* Messages (handled via floating toasts now) */}

          {/* Tab Content */}
          <div className="p-6 flex-1">
            
            {/* TABS 1: MY PROJECTS LIST */}
            {activeTab === "projects" && !editingProject && (
              <div className="space-y-4">
                {projectsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-500 gap-3">
                    <Loader2 size={24} className="animate-spin text-brand-rose" />
                    <p className="text-xs font-semibold">Loading your workspace...</p>
                  </div>
                ) : myProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-zinc-300 bg-zinc-50 p-6 rounded-none">
                    <FolderKanban size={36} className="text-zinc-300 mb-3" />
                    <h4 className="text-sm font-black uppercase text-brand-black mb-1">No Shared Projects</h4>
                    <p className="text-xs text-zinc-500 font-semibold max-w-xs mb-4">
                      Share your first developer project with the Lattice showcase gallery!
                    </p>
                    <button
                      onClick={() => setActiveTab("add")}
                      className="awwwards-btn-primary px-5 py-2.5 rounded-none text-xs"
                    >
                      Publish Project
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {myProjects.map((proj) => (
                      <div
                        key={proj.project_id}
                        className="group relative flex flex-col bg-white border-2 border-brand-black rounded-none shadow-[4px_4px_0px_0px_rgba(24,22,22,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all overflow-hidden"
                      >
                        <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-50 border-b-2 border-brand-black">
                          <img
                            src={proj.image_url}
                            alt={proj.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-brand-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button
                              onClick={() => openProjectDetailsModal(proj)}
                              className="p-2.5 bg-white border-2 border-brand-black hover:bg-brand-rose hover:text-white rounded-none text-brand-black transition-colors shadow-[2px_2px_0px_0px_rgba(24,22,22,1)] cursor-pointer"
                              title="Edit Details"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => setProjectImageModal(proj)}
                              className="p-2.5 bg-white border-2 border-brand-black hover:bg-brand-rose hover:text-white rounded-none text-brand-black transition-colors shadow-[2px_2px_0px_0px_rgba(24,22,22,1)] cursor-pointer"
                              title="Update Cover Image"
                            >
                              <ImageIcon size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteProject(proj.project_id)}
                              className="p-2.5 bg-brand-rose border-2 border-brand-black hover:bg-brand-rose hover:border-brand-rose hover:text-white text-white rounded-none transition-colors shadow-[2px_2px_0px_0px_rgba(24,22,22,1)] cursor-pointer"
                              title="Delete Project"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                        <div className="p-4 flex items-center justify-between bg-white">
                          <div>
                            <h4 className="text-xs font-black uppercase text-brand-black truncate max-w-[150px]">{proj.title}</h4>
                            <span className="text-[9px] text-brand-rose font-black uppercase tracking-wider">{proj.category}</span>
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={proj.github_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-400 hover:text-brand-rose"
                            >
                              <GithubIcon className="w-3.5 h-3.5 text-brand-black" />
                            </a>
                            <a
                              href={proj.live_demo_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-400 hover:text-brand-rose"
                            >
                              <ExternalLink size={14} className="text-brand-black stroke-[2.5]" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 1 EDIT SUB-FORM: EDIT PROJECT */}
            {activeTab === "projects" && editingProject && (
              <div className="space-y-6 max-w-lg">

                {/* --- Cover Image (independent section) --- */}
                <div className="bg-white border-2 border-brand-black rounded-none p-5 space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-brand-black border-b-2 border-zinc-100 pb-2">
                    Cover Image
                  </h4>
                  {editingProject.image_url && (
                    <img
                      src={editingProject.image_url}
                      alt="Current cover"
                      className="w-full h-28 object-cover border border-zinc-200"
                    />
                  )}
                  <button
                    type="button"
                    disabled={projectImageLoading || projectDetailsLoading}
                    onClick={() => projectImageEditRef.current?.click()}
                    className="w-full py-2.5 bg-zinc-50 border-2 border-dashed border-zinc-300 hover:border-brand-pink/50 hover:bg-zinc-100 rounded-none text-xs font-bold text-brand-black flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {projectImageLoading ? (
                      <><Loader2 size={13} className="animate-spin" /><span>Uploading Image...</span></>
                    ) : (
                      <><ImageIcon size={13} /><span>Change Cover Image</span></>
                    )}
                  </button>
                  <input
                    type="file"
                    ref={projectImageEditRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadProjectImage}
                  />
                </div>

                {/* --- Project Details Form (independent) --- */}
                <form onSubmit={handleSaveProjectDetails} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2">
                      Project Title
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-4 py-3 awwwards-input rounded-none text-sm font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-4 py-3 awwwards-input rounded-none text-sm font-semibold resize-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2">
                      Category
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full px-4 py-3 awwwards-input rounded-none text-sm font-semibold cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} className="bg-white text-brand-black">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2">
                        GitHub URL
                      </label>
                      <input
                        type="url"
                        value={editGithubLink}
                        onChange={(e) => setEditGithubLink(e.target.value)}
                        className="w-full px-4 py-3 awwwards-input rounded-none text-sm font-semibold"
                        placeholder="https://github.com/username/project"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2">
                        Live Demo URL
                      </label>
                      <input
                        type="url"
                        value={editLiveDemoLink}
                        onChange={(e) => setEditLiveDemoLink(e.target.value)}
                        className="w-full px-4 py-3 awwwards-input rounded-none text-sm font-semibold"
                        placeholder="https://myproject.vercel.app"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={projectDetailsLoading || projectImageLoading}
                      className="awwwards-btn-primary flex items-center justify-center gap-2 flex-1 py-2.5 sm:py-3.5 rounded-none font-bold text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {projectDetailsLoading ? <Loader2 size={14} className="animate-spin" /> : "Save Details"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProject(null)}
                      className="awwwards-btn-secondary flex-1 py-2.5 sm:py-3.5 rounded-none font-bold text-xs uppercase"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: ADD NEW PROJECT */}
            {activeTab === "add" && (
              <form onSubmit={handleCreateProject} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2">
                    Project Title
                  </label>
                  <input
                    type="text"
                    placeholder="E.g. Lattice Sandbox Portal"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 awwwards-input rounded-none text-sm font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Describe your sandbox, architectures, database structures, or UI animations..."
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 awwwards-input rounded-none text-sm font-semibold resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 awwwards-input rounded-none text-sm font-semibold cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} className="bg-white text-brand-black">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2">
                      Cover Image File
                    </label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3 bg-zinc-50 border-2 border-dashed border-zinc-300 hover:border-brand-pink/50 hover:bg-zinc-100 rounded-none text-xs text-brand-black font-bold flex items-center justify-center gap-2 cursor-pointer transition-all truncate px-2"
                    >
                      <ImageIcon size={14} className="text-brand-rose" />
                      {imageFile ? imageFile.name : "Select Cover Image"}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setImageFile(e.target.files[0]);
                        }
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2">
                      GitHub URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://github.com/username/repo"
                      value={githubLink}
                      onChange={(e) => setGithubLink(e.target.value)}
                      className="w-full px-4 py-3 awwwards-input rounded-none text-sm font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2">
                      Live Demo URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://demo.example.com"
                      value={liveDemoLink}
                      onChange={(e) => setLiveDemoLink(e.target.value)}
                      className="w-full px-4 py-3 awwwards-input rounded-none text-sm font-semibold"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="awwwards-btn-primary flex items-center justify-center gap-2 w-full py-2.5 sm:py-4 mt-2 sm:mt-4 rounded-none font-bold text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <span>Submit Project</span>
                      <ChevronRight size={14} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 3: ACCOUNT & PROFILE SETTINGS */}
            {activeTab === "profile" && (
              <div className="space-y-8 max-w-lg">
                
                {/* Profile Details Card */}
                <div className="bg-white border-2 border-brand-black rounded-none p-6 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-brand-black border-b-2 border-zinc-100 pb-3">
                    Profile Details
                  </h4>

                  {/* Avatar row */}
                  <div className="flex items-center gap-4">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="w-16 h-16 object-cover border-2 border-brand-black"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-brand-pink border-2 border-brand-black flex items-center justify-center text-brand-black text-2xl font-black">
                        {user?.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-sm font-black uppercase text-brand-black">{user?.name}</p>
                      <p className="text-[10px] text-zinc-400 font-semibold">{user?.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setAvatarModalOpen(true)}
                      className="awwwards-btn-secondary flex items-center justify-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 rounded-none text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(24,22,22,1)]"
                    >
                      <ImageIcon size={13} />
                      <span>Update Avatar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileDetailsModalOpen(true)}
                      className="awwwards-btn-primary flex items-center justify-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 rounded-none text-xs font-black uppercase"
                    >
                      <Edit2 size={13} />
                      <span>Edit Profile Details</span>
                    </button>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-brand-rose/[0.03] border-2 border-brand-rose rounded-none p-6 space-y-4">
                  <div className="flex items-center gap-2 text-brand-rose">
                    <ShieldAlert size={18} />
                    <h4 className="text-xs font-black uppercase tracking-wider">Danger Zone</h4>
                  </div>
                  <p className="text-xs text-zinc-700 font-semibold leading-relaxed">
                    Once you delete your account, there is no going back. All your projects, uploads, and data will be permanently purged from our platform.
                  </p>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteAccountLoading || profileLoading || avatarLoading}
                    className="awwwards-btn-primary flex items-center gap-2 py-2 px-3 sm:py-2.5 sm:px-5 bg-brand-rose border-brand-rose hover:bg-brand-rose/90 rounded-none text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleteAccountLoading && <Loader2 size={12} className="animate-spin" />}
                    <span>Delete My Account</span>
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>

      </div>

      {/* ── MODAL: Update Project Image ── */}
      {projectImageModal && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border-4 border-brand-black w-full max-w-sm max-h-[calc(100vh-2rem)] overflow-y-auto shadow-[8px_8px_0px_0px_rgba(24,22,22,1)] rounded-none space-y-5 p-6 animate-slide-in my-auto">
            <div className="flex items-center justify-between border-b-2 border-zinc-100 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-brand-black flex items-center gap-2">
                <ImageIcon size={15} /> Update Cover Image
              </h3>
              <button onClick={() => setProjectImageModal(null)} className="text-zinc-400 hover:text-brand-rose transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 font-semibold">
              Updating the cover image for: <span className="text-brand-black font-black">{projectImageModal.title}</span>
            </p>
            {projectImageModal.image_url && (
              <img src={projectImageModal.image_url} alt="Current" className="w-full h-32 object-cover border-2 border-zinc-200 rounded-none" />
            )}
            <button
              type="button"
              disabled={projectImageLoading}
              onClick={() => projectImageModalRef.current?.click()}
              className="w-full py-2.5 sm:py-3 bg-zinc-50 border-2 border-dashed border-zinc-300 hover:border-brand-rose hover:bg-zinc-100 rounded-none text-xs font-bold text-brand-black flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {projectImageLoading ? (
                <><Loader2 size={14} className="animate-spin" /><span>Uploading...</span></>
              ) : (
                <><ImageIcon size={14} /><span>Choose New Image</span></>
              )}
            </button>
            <input
              type="file"
              ref={projectImageModalRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUploadProjectImage(e, projectImageModal)}
            />
            <button
              type="button"
              onClick={() => setProjectImageModal(null)}
              className="w-full awwwards-btn-secondary py-2 sm:py-2.5 rounded-none font-bold text-xs uppercase cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: Update Project Details ── */}
      {projectDetailsModal && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border-4 border-brand-black w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto shadow-[8px_8px_0px_0px_rgba(24,22,22,1)] rounded-none p-4 sm:p-6 animate-slide-in my-auto">
            <div className="flex items-center justify-between border-b-2 border-zinc-100 pb-3 mb-3 sm:mb-5">
              <h3 className="text-sm font-black uppercase tracking-wider text-brand-black flex items-center gap-2">
                <Edit2 size={15} /> Edit Project Details
              </h3>
              <button onClick={() => setProjectDetailsModal(null)} className="text-zinc-400 hover:text-brand-rose transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveProjectDetails} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">Title</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-4 py-2 sm:py-2.5 awwwards-input rounded-none text-sm font-semibold" required />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">Description</label>
                <textarea rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full px-4 py-2 sm:py-2.5 awwwards-input rounded-none text-sm font-semibold resize-none" required />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">Category</label>
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full px-4 py-2 sm:py-2.5 awwwards-input rounded-none text-sm font-semibold cursor-pointer">
                  {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">GitHub URL</label>
                  <input type="url" value={editGithubLink} onChange={(e) => setEditGithubLink(e.target.value)} className="w-full px-3 py-2 sm:py-2.5 awwwards-input rounded-none text-xs font-semibold" placeholder="https://github.com/..." required />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">Live Demo URL</label>
                  <input type="url" value={editLiveDemoLink} onChange={(e) => setEditLiveDemoLink(e.target.value)} className="w-full px-3 py-2 sm:py-2.5 awwwards-input rounded-none text-xs font-semibold" placeholder="https://..." required />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={projectDetailsLoading} className="awwwards-btn-primary flex items-center justify-center gap-2 flex-1 py-2 sm:py-3 rounded-none font-bold text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                  {projectDetailsLoading ? <Loader2 size={13} className="animate-spin" /> : "Save Details"}
                </button>
                <button type="button" onClick={() => setProjectDetailsModal(null)} className="awwwards-btn-secondary flex-1 py-2 sm:py-3 rounded-none font-bold text-xs uppercase cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Update Avatar ── */}
      {avatarModalOpen && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border-4 border-brand-black w-full max-w-sm max-h-[calc(100vh-2rem)] overflow-y-auto shadow-[8px_8px_0px_0px_rgba(24,22,22,1)] rounded-none space-y-5 p-6 animate-slide-in my-auto">
            <div className="flex items-center justify-between border-b-2 border-zinc-100 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-brand-black flex items-center gap-2">
                <ImageIcon size={15} /> Update Avatar
              </h3>
              <button onClick={() => setAvatarModalOpen(false)} className="text-zinc-400 hover:text-brand-rose transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="flex justify-center">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="w-24 h-24 object-cover border-4 border-brand-black" />
              ) : (
                <div className="w-24 h-24 bg-brand-pink border-4 border-brand-black flex items-center justify-center text-brand-black text-3xl font-black">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <button
              type="button"
              disabled={avatarLoading}
              onClick={() => avatarModalInputRef.current?.click()}
              className="w-full py-2.5 sm:py-3 bg-zinc-50 border-2 border-dashed border-zinc-300 hover:border-brand-rose hover:bg-zinc-100 rounded-none text-xs font-bold text-brand-black flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {avatarLoading ? (
                <><Loader2 size={14} className="animate-spin" /><span>Uploading...</span></>
              ) : (
                <><ImageIcon size={14} /><span>Choose New Avatar</span></>
              )}
            </button>
            <p className="text-[9px] text-zinc-400 font-bold text-center tracking-wider">Supports PNG, JPG, or GIF up to 5MB.</p>
            <input
              type="file"
              ref={avatarModalInputRef}
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                await handleUploadAvatar(e);
                setAvatarModalOpen(false);
              }}
            />
            <button type="button" onClick={() => setAvatarModalOpen(false)} className="w-full awwwards-btn-secondary py-2.5 sm:py-2.5 rounded-none font-bold text-xs uppercase cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: Edit Profile Details ── */}
      {profileDetailsModalOpen && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border-4 border-brand-black w-full max-w-sm max-h-[calc(100vh-2rem)] overflow-y-auto shadow-[8px_8px_0px_0px_rgba(24,22,22,1)] rounded-none p-4 sm:p-6 animate-slide-in my-auto">
            <div className="flex items-center justify-between border-b-2 border-zinc-100 pb-3 mb-3 sm:mb-5">
              <h3 className="text-sm font-black uppercase tracking-wider text-brand-black flex items-center gap-2">
                <UserIcon size={15} /> Edit Profile Details
              </h3>
              <button onClick={() => setProfileDetailsModalOpen(false)} className="text-zinc-400 hover:text-brand-rose transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={async (e) => { await handleUpdateProfile(e); setProfileDetailsModalOpen(false); }} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">Username</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-2.5 sm:top-3 text-brand-black" size={15} />
                  <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full pl-10 pr-4 py-2 sm:py-2.5 awwwards-input rounded-none text-sm font-semibold" required />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">New Password (optional)</label>
                <input type="password" placeholder="Leave blank to keep current" value={profilePassword} onChange={(e) => setProfilePassword(e.target.value)} className="w-full px-4 py-2 sm:py-2.5 awwwards-input rounded-none text-sm font-semibold" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={profileLoading} className="awwwards-btn-primary flex items-center justify-center gap-2 flex-1 py-2 sm:py-3 rounded-none font-bold text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                  {profileLoading ? <Loader2 size={13} className="animate-spin" /> : "Save Changes"}
                </button>
                <button type="button" onClick={() => setProfileDetailsModalOpen(false)} className="awwwards-btn-secondary flex-1 py-2 sm:py-3 rounded-none font-bold text-xs uppercase cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border-4 border-brand-black p-4 sm:p-6 max-w-sm w-full max-h-[calc(100vh-2rem)] overflow-y-auto shadow-[8px_8px_0px_0px_rgba(24,22,22,1)] space-y-4 rounded-none animate-slide-in my-auto">
            <div className="flex items-center gap-2 text-brand-rose">
              <ShieldAlert size={20} />
              <h3 className="text-sm font-black uppercase tracking-wider">{confirmConfig.title}</h3>
            </div>
            <p className="text-xs text-zinc-700 font-semibold leading-relaxed">
              {confirmConfig.message}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={confirmConfig.onConfirm}
                className="awwwards-btn-primary flex-1 py-2 sm:py-3 bg-brand-rose border-brand-rose hover:bg-brand-rose/90 text-white rounded-none font-bold text-xs uppercase cursor-pointer"
              >
                Yes, Proceed
              </button>
              <button
                onClick={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
                className="awwwards-btn-secondary flex-1 py-2 sm:py-3 rounded-none font-bold text-xs uppercase cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
