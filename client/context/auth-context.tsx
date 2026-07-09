"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api, User, LoginRequest, SignUpRequest, UpdateDetailsRequest } from "../lib/api";
import { Loader2 } from "lucide-react";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  signUp: (data: SignUpRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Syncing Lattice Session...");

  const refreshUser = async () => {
    try {
      const response = await api.getUserProfile();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (data: LoginRequest) => {
    setLoadingMessage("Logging you in...");
    setLoading(true);
    try {
      await api.login(data);
      await refreshUser();
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (data: SignUpRequest) => {
    setLoadingMessage("Creating your account...");
    setLoading(true);
    try {
      await api.signUp(data);
      await refreshUser();
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoadingMessage("Signing you out...");
    setLoading(true);
    try {
      await api.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signUp, logout, refreshUser }}>
      {!isInitialized ? (
        <div className="min-h-screen bg-white text-brand-black flex flex-col items-center justify-center gap-4 select-none">
          <div className="w-10 h-10 border-4 border-brand-black border-t-brand-rose animate-spin rounded-none shadow-[3px_3px_0px_0px_rgba(24,22,22,1)]" />
          <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Syncing Lattice Session...</p>
        </div>
      ) : (
        <>
          {children}
          {loading && (
            <div className="fixed inset-0 z-[9999] bg-white/85 backdrop-blur-sm text-brand-black flex flex-col items-center justify-center gap-4 select-none animate-fade-in">
              <div className="w-10 h-10 border-4 border-brand-black border-t-brand-rose animate-spin rounded-none shadow-[3px_3px_0px_0px_rgba(24,22,22,1)]" />
              <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">{loadingMessage}</p>
            </div>
          )}
        </>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
