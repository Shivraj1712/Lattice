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
}) => {
  const { user, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"projects" | "add" | "profile">(initialTab);
  const toast = useToast();
  
  // Local lists
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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

  // Save Project Details Edit
  const handleSaveProjectDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    resetStatus();
    setActionLoading(true);

    try {
      await api.updateProjectDetails(editingProject.project_id, {
        title: editTitle,
        description: editDescription,
        category: editCategory,
        github_link: editGithubLink,
        live_demo_link: editLiveDemoLink,
      });
      toast.success("Project details updated!");
      setEditingProject(null);
      await fetchMyProjects();
    } catch (err: any) {
      toast.error(err.message || "Failed to update project");
    } finally {
      setActionLoading(false);
    }
  };

  // Save Project Cover Image Edit
  const handleUploadProjectImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingProject || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    resetStatus();
    setActionLoading(true);

    try {
      await api.updateProjectImage(editingProject.project_id, file);
      toast.success("Project cover image updated successfully!");
      setEditingProject(null);
      await fetchMyProjects();
    } catch (err: any) {
      toast.error(err.message || "Failed to update project image");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Project
  const handleDeleteProject = async (projectId: string) => {
    requestConfirm(
      "Delete Project",
      "Are you sure you want to delete this project? This action is permanent and cannot be undone.",
      async () => {
        resetStatus();
        setActionLoading(true);
        try {
          await api.deleteProject(projectId);
          toast.success("Project deleted.");
          await fetchMyProjects();
        } catch (err: any) {
          toast.error(err.message || "Failed to delete project");
        } finally {
          setActionLoading(false);
        }
      }
    );
  };

  // Update Profile Name/Password
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    resetStatus();
    setActionLoading(true);

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
      setActionLoading(false);
    }
  };

  // Upload Profile Avatar
  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setAvatarFile(file);
    resetStatus();
    setActionLoading(true);

    try {
      await api.updateUserImage(file);
      toast.success("Avatar updated successfully!");
      setAvatarFile(null);
      await refreshUser();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete User Account
  const handleDeleteAccount = async () => {
    requestConfirm(
      "Delete Account",
      "WARNING: Deleting your account will remove your profile and ALL your shared projects. This cannot be undone. Do you wish to continue?",
      async () => {
        resetStatus();
        setActionLoading(true);
        try {
          await api.deleteUser();
          onClose();
          await logout();
          toast.success("Account deleted successfully.");
          window.location.reload();
        } catch (err: any) {
          toast.error(err.message || "Failed to delete user account");
        } finally {
          setActionLoading(false);
        }
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 transition-all duration-300">
      <div className="relative w-full max-w-4xl h-[85vh] bg-white border-2 border-brand-black rounded-none shadow-[8px_8px_0px_0px_rgba(24,22,22,1)] flex overflow-hidden">
        
        {/* Sidebar tabs */}
        <div className="w-64 bg-zinc-50 border-r-2 border-brand-black flex flex-col justify-between p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black uppercase text-brand-black tracking-tight">
                Dashboard //
              </h2>
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black mt-1">
                Lattice Studio
              </p>
            </div>

            <nav className="space-y-2">
              <button
                onClick={() => {
                  setActiveTab("projects");
                  setEditingProject(null);
                  resetStatus();
                }}
                className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-black uppercase tracking-wider border-2 border-transparent transition-all cursor-pointer rounded-none ${
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
                className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-black uppercase tracking-wider border-2 border-transparent transition-all cursor-pointer rounded-none ${
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
                className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-black uppercase tracking-wider border-2 border-transparent transition-all cursor-pointer rounded-none ${
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
            className="awwwards-btn-secondary w-full py-2.5 rounded-none text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-[3px_3px_0px_0px_rgba(24,22,22,1)]"
          >
            <span>Close Console</span>
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-white">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b-2 border-brand-black bg-zinc-50 sticky top-0 z-10">
            <h3 className="text-sm font-black uppercase tracking-wider text-brand-black flex items-center gap-2">
              {activeTab === "projects" && (editingProject ? "Edit Project Details //" : "Project Directory //")}
              {activeTab === "add" && "Submit Project //"}
              {activeTab === "profile" && "Lattice Identity Manager //"}
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
                              onClick={() => startEditProject(proj)}
                              className="p-2.5 bg-white border-2 border-brand-black hover:bg-brand-rose hover:text-white rounded-none text-brand-black transition-colors shadow-[2px_2px_0px_0px_rgba(24,22,22,1)] cursor-pointer"
                              title="Edit Details"
                            >
                              <Edit2 size={15} />
                            </button>
                            <label className="p-2.5 bg-white border-2 border-brand-black hover:bg-brand-rose hover:text-white rounded-none text-brand-black transition-colors shadow-[2px_2px_0px_0px_rgba(24,22,22,1)] cursor-pointer flex items-center justify-center">
                              <ImageIcon size={15} />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  setEditingProject(proj);
                                  handleUploadProjectImage(e);
                                }}
                              />
                            </label>
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

            {/* TAB 1 EDIT SUB-FORM: EDIT PROJECT DETAILS */}
            {activeTab === "projects" && editingProject && (
              <form onSubmit={handleSaveProjectDetails} className="space-y-4 max-w-lg">
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

                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2">
                      Cover Image
                    </label>
                    <button
                      type="button"
                      onClick={() => projectImageEditRef.current?.click()}
                      className="w-full py-3 bg-zinc-50 border-2 border-dashed border-zinc-300 hover:border-brand-pink/50 hover:bg-zinc-100 rounded-none text-xs font-bold text-brand-black flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <ImageIcon size={14} />
                      Update Cover Image
                    </button>
                    <input
                      type="file"
                      ref={projectImageEditRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadProjectImage}
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
                    disabled={actionLoading}
                    className="awwwards-btn-primary flex items-center justify-center gap-2 flex-1 py-3.5 rounded-none font-bold text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? <Loader2 size={14} className="animate-spin" /> : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProject(null)}
                    className="awwwards-btn-secondary flex-1 py-3.5 rounded-none font-bold text-xs uppercase"
                  >
                    Cancel
                  </button>
                </div>
              </form>
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
                  className="awwwards-btn-primary flex items-center justify-center gap-2 w-full py-4 mt-4 rounded-none font-bold text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed"
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
                
                {/* Profile Details (Name, Password, Avatar) */}
                <div className="bg-white border-2 border-brand-black rounded-none p-6 space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-wider text-brand-black border-b-2 border-zinc-100 pb-3">
                    Profile Details
                  </h4>

                  {/* Avatar upload */}
                  <div className="flex items-center gap-4.5">
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
                    <div>
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="awwwards-btn-secondary px-4 py-2 rounded-none text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(24,22,22,1)]"
                      >
                        Upload Avatar
                      </button>
                      <p className="text-[9px] text-zinc-400 font-bold tracking-wider mt-1.5">
                        Supports PNG, JPG, or GIF up to 5MB.
                      </p>
                      <input
                        type="file"
                        ref={avatarInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadAvatar}
                      />
                    </div>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2">
                        Username
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-3.5 top-3.5 text-brand-black" size={16} />
                        <input
                          type="text"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 awwwards-input rounded-none text-sm font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2">
                        New Password (optional)
                      </label>
                      <input
                        type="password"
                        placeholder="Leave blank to keep current"
                        value={profilePassword}
                        onChange={(e) => setProfilePassword(e.target.value)}
                        className="w-full px-4 py-3 awwwards-input rounded-none text-sm font-semibold"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="awwwards-btn-primary flex items-center gap-2 px-5 py-2.5 rounded-none text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading && <Loader2 size={12} className="animate-spin" />}
                      <span>Save Account Details</span>
                    </button>
                  </form>
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
                    disabled={actionLoading}
                    className="awwwards-btn-primary flex items-center gap-2 py-2.5 px-5 bg-brand-rose border-brand-rose hover:bg-brand-rose/90 rounded-none text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading && <Loader2 size={12} className="animate-spin" />}
                    <span>Delete My Account</span>
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>

      </div>

      {/* Custom Confirmation Modal */}
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border-4 border-brand-black p-6 max-w-sm w-full shadow-[8px_8px_0px_0px_rgba(24,22,22,1)] space-y-4 rounded-none animate-slide-in">
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
                className="awwwards-btn-primary flex-1 py-3 bg-brand-rose border-brand-rose hover:bg-brand-rose/90 text-white rounded-none font-bold text-xs uppercase cursor-pointer"
              >
                Yes, Proceed
              </button>
              <button
                onClick={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
                className="awwwards-btn-secondary flex-1 py-3 rounded-none font-bold text-xs uppercase cursor-pointer"
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
