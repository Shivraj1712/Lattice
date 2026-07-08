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

// Mock compatibility helpers (hardcoded to false as offline mode is removed)
export const isOffline = () => false;

// Generic Request Wrapper that interacts directly with Server
async function request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  data?: any,
  headers?: any
): Promise<APIResponse<T>> {
  try {
    const response = await client.request<APIResponse<T>>({
      method,
      url: path,
      data,
      headers,
    });
    return response.data;
  } catch (error: any) {
    if (!axios.isAxiosError(error) || !error.response || error.response.status >= 500) {
      console.error("[Lattice API Error]", error);
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
    return request<null>("POST", "/api/v1/auth/signup", data);
  },

  async login(data: LoginRequest): Promise<APIResponse<null>> {
    return request<null>("POST", "/api/v1/auth/login", data);
  },

  async logout(): Promise<APIResponse<null>> {
    return request<null>("POST", "/api/v1/auth/logout", {});
  },

  async getUserProfile(): Promise<APIResponse<User>> {
    return request<User>("GET", "/api/v1/auth/profile");
  },

  async getUserProfileFromServer(): Promise<APIResponse<User>> {
    return request<User>("GET", "/api/v1/auth/profile");
  },

  async getPublicProfile(email: string): Promise<APIResponse<PublicProfile>> {
    return request<PublicProfile>("POST", "/api/v1/auth/publicProfile", { email });
  },

  async updateUserDetails(data: UpdateDetailsRequest): Promise<APIResponse<null>> {
    return request<null>("PUT", "/api/v1/auth/profile/update", data);
  },

  async updateUserImage(image: File): Promise<APIResponse<null>> {
    const formData = new FormData();
    formData.append("image", image);

    return request<null>("PUT", "/api/v1/auth/profile/pic", formData);
  },

  async deleteUser(): Promise<APIResponse<null>> {
    return request<null>("DELETE", "/api/v1/auth/profile", {});
  },

  getGoogleAuthUrl(): string {
    return `${BASE_URL}/api/v1/auth/google`;
  },

  // ==========================================
  // 2. Projects API
  // ==========================================

  async getAllProjects(): Promise<APIResponse<Project[]>> {
    return request<Project[]>("GET", "/api/v1/projects/all");
  },

  async getProjectsByUserEmail(email: string): Promise<APIResponse<Project[]>> {
    return request<Project[]>("POST", "/api/v1/projects/email", { email });
  },

  async getAuthUserProjects(): Promise<APIResponse<Project[]>> {
    return request<Project[]>("GET", "/api/v1/projects");
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

    return request<null>("POST", "/api/v1/projects", formData);
  },

  async updateProjectImage(projectId: string, image: File): Promise<APIResponse<null>> {
    const formData = new FormData();
    formData.append("image", image);

    return request<null>("PUT", `/api/v1/projects/image/${projectId}`, formData);
  },

  async updateProjectDetails(
    projectId: string,
    data: UpdateProjectRequest
  ): Promise<APIResponse<null>> {
    return request<null>("PUT", `/api/v1/projects/${projectId}`, data);
  },

  async deleteProject(projectId: string): Promise<APIResponse<null>> {
    return request<null>("DELETE", `/api/v1/projects/${projectId}`, {});
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

    return request<Project[]>("GET", `/api/v1/projects/search${queryString}`);
  },
};
