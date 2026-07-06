import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface User {
  user_id: string;
  name: string;
  email: string;
  avatar_url: string;
  created_at: string;
}

export interface PublicProfile {
  name: string;
  email: string;
  avatar_url: string;
}

export interface Project {
  project_id: string;
  user_id: string;
  title: string;
  description: string;
  image_url: string;
  github_link: string;
  live_demo_link: string;
  category: string;
  created_at: string;
  user?: PublicProfile;
}

export interface APIResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface SignUpRequest {
  name: string;
  email: string;
  password?: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface UpdateDetailsRequest {
  name: string;
  password?: string;
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  github_link: string;
  live_demo_link: string;
  category?: string;
  image: File;
}

export interface UpdateProjectRequest {
  title: string;
  description: string;
  github_link: string;
  live_demo_link: string;
  category?: string;
}

export interface SearchFilterParams {
  search?: string;
  category?: string;
}

export class APIError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "APIError";
  }
}

// --- Axios Configuration ---
const client = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Carry session cookies
});

// Flag to indicate whether we are falling back to local storage mock data
let offlineMode = false;

// Helper to check if offline mode is active
export const isOffline = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("lattice_offline_fallback") === "true";
  }
  return offlineMode;
};

// Toggle offline mode helper
const setOfflineMode = (active: boolean) => {
  offlineMode = active;
  if (typeof window !== "undefined") {
    localStorage.setItem("lattice_offline_fallback", active ? "true" : "false");
    // Dispatch custom event to notify components (like Header) to update UI
    window.dispatchEvent(new Event("lattice_offline_status_changed"));
  }
};

// --- MOCK DATABASE (LocalStorage) ---

const MOCK_PROJECTS_KEY = "lattice_mock_projects";
const MOCK_USERS_KEY = "lattice_mock_users";
const MOCK_SESSION_KEY = "lattice_mock_session";

const INITIAL_PROJECTS: Project[] = [
  {
    project_id: "mock-proj-1",
    user_id: "mock-user-1",
    title: "Aether - WebGL Sandbox",
    description: "A futuristic WebGL fluid simulation showcasing shaders, physics particles, and custom cursor animations. Built using Three.js and custom fragment shaders.",
    image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    github_link: "https://github.com/aether/sandbox",
    live_demo_link: "https://aether-demo.vercel.app",
    category: "Frontend",
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    user: {
      name: "Shivraj",
      email: "shivraj@lattice.co",
      avatar_url: "",
    }
  },
  {
    project_id: "mock-proj-2",
    user_id: "mock-user-2",
    title: "OmniDB - Distributed Store",
    description: "A highly available distributed key-value store database written in Go. Supports Raft consensus algorithm, write-ahead logging, and active replication.",
    image_url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80",
    github_link: "https://github.com/omnidb/kv",
    live_demo_link: "https://omnidb.io",
    category: "Backend",
    created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    user: {
      name: "Alex Johnson",
      email: "alex@omnidb.io",
      avatar_url: "",
    }
  },
  {
    project_id: "mock-proj-3",
    user_id: "mock-user-3",
    title: "Zenith - Canvas Studio",
    description: "Real-time design collaborative tool with infinite canvas, vector drawing nodes, and live websocket cursors. Built with React, Rust, and WebAssembly.",
    image_url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80",
    github_link: "https://github.com/zenith/studio",
    live_demo_link: "https://zenith-studio.design",
    category: "Fullstack",
    created_at: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
    user: {
      name: "Elena Rostova",
      email: "elena@zenith.design",
      avatar_url: "",
    }
  },
  {
    project_id: "mock-proj-4",
    user_id: "mock-user-4",
    title: "Helix - DL Visualizer",
    description: "An interactive neural network builder and visualizer. Build multi-layered neural networks in real-time and inspect training loss metrics graphs.",
    image_url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
    github_link: "https://github.com/helix/ai",
    live_demo_link: "https://helix-ai.net",
    category: "AI/ML",
    created_at: new Date(Date.now() - 3600000 * 24 * 18).toISOString(),
    user: {
      name: "Nikunj Patel",
      email: "nikunj@helix-ai.net",
      avatar_url: "",
    }
  }
];

// Helper: Convert File to Base64 String
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

// Initial Seeding
const seedMockDatabase = () => {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(MOCK_PROJECTS_KEY)) {
    localStorage.setItem(MOCK_PROJECTS_KEY, JSON.stringify(INITIAL_PROJECTS));
  }
  if (!localStorage.getItem(MOCK_USERS_KEY)) {
    const defaultUser: User = {
      user_id: "mock-user-1",
      name: "Shivraj",
      email: "shivraj@lattice.co",
      avatar_url: "",
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify([defaultUser]));
  }
};

// Call Seeder immediately
seedMockDatabase();

// Mock API implementations for fallback execution
const mockApi = {
  signUp: async (data: SignUpRequest): Promise<APIResponse<null>> => {
    seedMockDatabase();
    const users: User[] = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || "[]");
    
    if (users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      throw new APIError(400, "User already exists with this email address");
    }

    const newUser: User = {
      user_id: `mock-user-${Date.now()}`,
      name: data.name,
      email: data.email,
      avatar_url: "",
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(newUser));
    return { success: true, message: "Registered and logged in (offline sandbox mode)" };
  },

  login: async (data: LoginRequest): Promise<APIResponse<null>> => {
    seedMockDatabase();
    const users: User[] = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || "[]");
    const user = users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    
    if (!user) {
      throw new APIError(401, "Invalid email credentials in sandbox environment");
    }

    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(user));
    return { success: true, message: "Logged in successfully (offline sandbox mode)" };
  },

  logout: async (): Promise<APIResponse<null>> => {
    localStorage.removeItem(MOCK_SESSION_KEY);
    return { success: true, message: "Logged out from sandbox" };
  },

  getUserProfile: async (): Promise<APIResponse<User>> => {
    const session = localStorage.getItem(MOCK_SESSION_KEY);
    if (!session) {
      throw new APIError(401, "No sandbox session found");
    }
    return { success: true, message: "Fetched session profile", data: JSON.parse(session) };
  },

  getPublicProfile: async (email: string): Promise<APIResponse<PublicProfile>> => {
    seedMockDatabase();
    const users: User[] = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || "[]");
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new APIError(404, "User profile not found in sandbox");
    }
    return {
      success: true,
      message: "Fetched public sandbox profile",
      data: { name: user.name, email: user.email, avatar_url: user.avatar_url }
    };
  },

  updateUserDetails: async (data: UpdateDetailsRequest): Promise<APIResponse<null>> => {
    const sessionStr = localStorage.getItem(MOCK_SESSION_KEY);
    if (!sessionStr) throw new APIError(401, "Unauthenticated");
    
    const currentUser: User = JSON.parse(sessionStr);
    currentUser.name = data.name;
    
    // Update users storage
    const users: User[] = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || "[]");
    const idx = users.findIndex(u => u.user_id === currentUser.user_id);
    if (idx !== -1) {
      users[idx] = currentUser;
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
    }
    
    // Update session
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(currentUser));
    
    // Update user public profiles in projects
    const projects: Project[] = JSON.parse(localStorage.getItem(MOCK_PROJECTS_KEY) || "[]");
    projects.forEach(p => {
      if (p.user_id === currentUser.user_id) {
        p.user = { name: currentUser.name, email: currentUser.email, avatar_url: currentUser.avatar_url };
      }
    });
    localStorage.setItem(MOCK_PROJECTS_KEY, JSON.stringify(projects));

    return { success: true, message: "Sandbox profile updated" };
  },

  updateUserImage: async (image: File): Promise<APIResponse<null>> => {
    const sessionStr = localStorage.getItem(MOCK_SESSION_KEY);
    if (!sessionStr) throw new APIError(401, "Unauthenticated");
    
    const currentUser: User = JSON.parse(sessionStr);
    const base64 = await fileToBase64(image);
    currentUser.avatar_url = base64;
    
    // Update users storage
    const users: User[] = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || "[]");
    const idx = users.findIndex(u => u.user_id === currentUser.user_id);
    if (idx !== -1) {
      users[idx] = currentUser;
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
    }

    // Update session
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(currentUser));

    // Update user public profiles in projects
    const projects: Project[] = JSON.parse(localStorage.getItem(MOCK_PROJECTS_KEY) || "[]");
    projects.forEach(p => {
      if (p.user_id === currentUser.user_id) {
        p.user = { name: currentUser.name, email: currentUser.email, avatar_url: currentUser.avatar_url };
      }
    });
    localStorage.setItem(MOCK_PROJECTS_KEY, JSON.stringify(projects));

    return { success: true, message: "Sandbox avatar updated" };
  },

  deleteUser: async (): Promise<APIResponse<null>> => {
    const sessionStr = localStorage.getItem(MOCK_SESSION_KEY);
    if (!sessionStr) throw new APIError(401, "Unauthenticated");
    const currentUser: User = JSON.parse(sessionStr);

    // Delete user
    const users: User[] = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || "[]");
    const updatedUsers = users.filter(u => u.user_id !== currentUser.user_id);
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(updatedUsers));

    // Delete user's projects
    const projects: Project[] = JSON.parse(localStorage.getItem(MOCK_PROJECTS_KEY) || "[]");
    const updatedProjects = projects.filter(p => p.user_id !== currentUser.user_id);
    localStorage.setItem(MOCK_PROJECTS_KEY, JSON.stringify(updatedProjects));

    localStorage.removeItem(MOCK_SESSION_KEY);
    return { success: true, message: "Sandbox profile deleted" };
  },

  getAllProjects: async (): Promise<APIResponse<Project[]>> => {
    seedMockDatabase();
    const projects: Project[] = JSON.parse(localStorage.getItem(MOCK_PROJECTS_KEY) || "[]");
    // Sort by created date descending
    projects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { success: true, message: "Fetched all sandbox projects", data: projects };
  },

  getProjectsByUserEmail: async (email: string): Promise<APIResponse<Project[]>> => {
    seedMockDatabase();
    const projects: Project[] = JSON.parse(localStorage.getItem(MOCK_PROJECTS_KEY) || "[]");
    const filtered = projects.filter(p => p.user?.email.toLowerCase() === email.toLowerCase());
    return { success: true, message: "Fetched projects for email", data: filtered };
  },

  getAuthUserProjects: async (): Promise<APIResponse<Project[]>> => {
    const sessionStr = localStorage.getItem(MOCK_SESSION_KEY);
    if (!sessionStr) throw new APIError(401, "Unauthenticated");
    const currentUser: User = JSON.parse(sessionStr);

    seedMockDatabase();
    const projects: Project[] = JSON.parse(localStorage.getItem(MOCK_PROJECTS_KEY) || "[]");
    const filtered = projects.filter(p => p.user_id === currentUser.user_id);
    return { success: true, message: "Fetched authenticated user projects", data: filtered };
  },

  createProject: async (data: CreateProjectRequest): Promise<APIResponse<null>> => {
    const sessionStr = localStorage.getItem(MOCK_SESSION_KEY);
    if (!sessionStr) throw new APIError(401, "Unauthenticated");
    const currentUser: User = JSON.parse(sessionStr);

    const base64 = await fileToBase64(data.image);

    const newProject: Project = {
      project_id: `mock-proj-${Date.now()}`,
      user_id: currentUser.user_id,
      title: data.title,
      description: data.description,
      image_url: base64,
      github_link: data.github_link,
      live_demo_link: data.live_demo_link,
      category: data.category || "Other",
      created_at: new Date().toISOString(),
      user: {
        name: currentUser.name,
        email: currentUser.email,
        avatar_url: currentUser.avatar_url,
      }
    };

    seedMockDatabase();
    const projects: Project[] = JSON.parse(localStorage.getItem(MOCK_PROJECTS_KEY) || "[]");
    projects.push(newProject);
    localStorage.setItem(MOCK_PROJECTS_KEY, JSON.stringify(projects));

    return { success: true, message: "Project created in sandbox" };
  },

  updateProjectImage: async (projectId: string, image: File): Promise<APIResponse<null>> => {
    seedMockDatabase();
    const projects: Project[] = JSON.parse(localStorage.getItem(MOCK_PROJECTS_KEY) || "[]");
    const idx = projects.findIndex(p => p.project_id === projectId);
    if (idx === -1) throw new APIError(404, "Project not found");
    
    const base64 = await fileToBase64(image);
    projects[idx].image_url = base64;
    localStorage.setItem(MOCK_PROJECTS_KEY, JSON.stringify(projects));

    return { success: true, message: "Cover image updated" };
  },

  updateProjectDetails: async (projectId: string, data: UpdateProjectRequest): Promise<APIResponse<null>> => {
    seedMockDatabase();
    const projects: Project[] = JSON.parse(localStorage.getItem(MOCK_PROJECTS_KEY) || "[]");
    const idx = projects.findIndex(p => p.project_id === projectId);
    if (idx === -1) throw new APIError(404, "Project not found");
    
    projects[idx].title = data.title;
    projects[idx].description = data.description;
    projects[idx].github_link = data.github_link;
    projects[idx].live_demo_link = data.live_demo_link;
    projects[idx].category = data.category || "Other";
    
    localStorage.setItem(MOCK_PROJECTS_KEY, JSON.stringify(projects));
    return { success: true, message: "Details updated" };
  },

  deleteProject: async (projectId: string): Promise<APIResponse<null>> => {
    seedMockDatabase();
    const projects: Project[] = JSON.parse(localStorage.getItem(MOCK_PROJECTS_KEY) || "[]");
    const filtered = projects.filter(p => p.project_id !== projectId);
    localStorage.setItem(MOCK_PROJECTS_KEY, JSON.stringify(filtered));
    return { success: true, message: "Project deleted from sandbox" };
  },

  searchAndFilterProjects: async (params: SearchFilterParams): Promise<APIResponse<Project[]>> => {
    seedMockDatabase();
    let projects: Project[] = JSON.parse(localStorage.getItem(MOCK_PROJECTS_KEY) || "[]");

    if (params.category) {
      projects = projects.filter(p => p.category.toLowerCase() === params.category!.toLowerCase());
    }

    if (params.search) {
      const term = params.search.toLowerCase();
      projects = projects.filter(p => 
        p.title.toLowerCase().includes(term) || 
        p.description.toLowerCase().includes(term)
      );
    }

    // Sort descending
    projects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { success: true, message: "Filtered projects", data: projects };
  }
};

// Generic Request Wrapper that auto-falls back to Mock API if Server Offline
async function request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  data?: any,
  headers?: any,
  fallbackFn?: () => Promise<APIResponse<T>>
): Promise<APIResponse<T>> {
  // If we are already flagged as offline, bypass server completely to prevent delay
  if (isOffline() && fallbackFn) {
    console.warn(`[Lattice API] Server offline. Calling fallback method for ${path}`);
    return fallbackFn();
  }

  try {
    const response = await client.request<APIResponse<T>>({
      method,
      url: path,
      data,
      headers,
    });
    
    // If server came back online, disable offline mode flag
    if (isOffline()) {
      setOfflineMode(false);
    }
    return response.data;
  } catch (error: any) {
    const isConnRefused = axios.isAxiosError(error) && (!error.response || error.code === "ERR_NETWORK" || error.message.includes("Network Error"));
    
    // Switch to fallback if connection refused
    if (isConnRefused && fallbackFn) {
      console.warn(`[Lattice API] Network connection refused for ${path}. Switching to localStorage mock sandbox.`);
      setOfflineMode(true);
      return fallbackFn();
    }

    if (axios.isAxiosError(error) && error.response) {
      const respData = error.response.data as any;
      throw new APIError(
        error.response.status,
        respData?.message || error.message || "Request failed"
      );
    }
    
    throw new APIError(503, "Lattice network server is offline or unreachable");
  }
}

// --- API Client Implementation ---

export const api = {
  // ==========================================
  // 1. Authentication & User API
  // ==========================================

  async signUp(data: SignUpRequest): Promise<APIResponse<null>> {
    return request<null>("POST", "/api/v1/auth/signup", data, {}, () => mockApi.signUp(data));
  },

  async login(data: LoginRequest): Promise<APIResponse<null>> {
    return request<null>("POST", "/api/v1/auth/login", data, {}, () => mockApi.login(data));
  },

  async logout(): Promise<APIResponse<null>> {
    return request<null>("POST", "/api/v1/auth/logout", {}, {}, () => mockApi.logout());
  },

  async getUserProfile(): Promise<APIResponse<User>> {
    return request<User>("GET", "/api/v1/auth/profile", {}, {}, () => mockApi.getUserProfile());
  },

  async getPublicProfile(email: string): Promise<APIResponse<PublicProfile>> {
    return request<PublicProfile>("POST", "/api/v1/auth/publicProfile", { email }, {}, () => mockApi.getPublicProfile(email));
  },

  async updateUserDetails(data: UpdateDetailsRequest): Promise<APIResponse<null>> {
    return request<null>("PUT", "/api/v1/auth/profile/update", data, {}, () => mockApi.updateUserDetails(data));
  },

  async updateUserImage(image: File): Promise<APIResponse<null>> {
    const formData = new FormData();
    formData.append("image", image);

    return request<null>("PUT", "/api/v1/auth/profile/pic", formData, {
      "Content-Type": "multipart/form-data",
    }, () => mockApi.updateUserImage(image));
  },

  async deleteUser(): Promise<APIResponse<null>> {
    return request<null>("DELETE", "/api/v1/auth/profile", {}, {}, () => mockApi.deleteUser());
  },

  getGoogleAuthUrl(): string {
    return `${BASE_URL}/api/v1/auth/google`;
  },

  // ==========================================
  // 2. Projects API
  // ==========================================

  async getAllProjects(): Promise<APIResponse<Project[]>> {
    return request<Project[]>("GET", "/api/v1/projects/all", {}, {}, () => mockApi.getAllProjects());
  },

  async getProjectsByUserEmail(email: string): Promise<APIResponse<Project[]>> {
    return request<Project[]>("POST", "/api/v1/projects/email", { email }, {}, () => mockApi.getProjectsByUserEmail(email));
  },

  async getAuthUserProjects(): Promise<APIResponse<Project[]>> {
    return request<Project[]>("GET", "/api/v1/projects", {}, {}, () => mockApi.getAuthUserProjects());
  },

  async createProject(data: CreateProjectRequest): Promise<APIResponse<null>> {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("github_link", data.github_link);
    formData.append("live_demo_link", data.live_demo_link);
    if (data.category) {
      formData.append("category", data.category);
    }
    formData.append("image", data.image);

    return request<null>("POST", "/api/v1/projects", formData, {
      "Content-Type": "multipart/form-data",
    }, () => mockApi.createProject(data));
  },

  async updateProjectImage(projectId: string, image: File): Promise<APIResponse<null>> {
    const formData = new FormData();
    formData.append("image", image);

    return request<null>("PUT", `/api/v1/projects/image/${projectId}`, formData, {
      "Content-Type": "multipart/form-data",
    }, () => mockApi.updateProjectImage(projectId, image));
  },

  async updateProjectDetails(
    projectId: string,
    data: UpdateProjectRequest
  ): Promise<APIResponse<null>> {
    return request<null>("PUT", `/api/v1/projects/${projectId}`, data, {}, () => mockApi.updateProjectDetails(projectId, data));
  },

  async deleteProject(projectId: string): Promise<APIResponse<null>> {
    return request<null>("DELETE", `/api/v1/projects/${projectId}`, {}, {}, () => mockApi.deleteProject(projectId));
  },

  async searchAndFilterProjects(
    params: SearchFilterParams
  ): Promise<APIResponse<Project[]>> {
    const queryParts: string[] = [];
    if (params.search) {
      queryParts.push(`search=${encodeURIComponent(params.search)}`);
    }
    if (params.category) {
      queryParts.push(`category=${encodeURIComponent(params.category)}`);
    }
    const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

    return request<Project[]>("GET", `/api/v1/projects/search${queryString}`, {}, {}, () => mockApi.searchAndFilterProjects(params));
  },
};
