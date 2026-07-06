"use client";

import React, { useState } from "react";
import { useAuth } from "../context/auth-context";
import { X, Lock, Mail, User as UserIcon, Loader2, ArrowRight } from "lucide-react";
import { api } from "../lib/api";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "login" | "signup";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = "login",
}) => {
  const { login, signUp } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === "login") {
        if (!email || !password) throw new Error("Please fill in all fields");
        await login({ email, password });
      } else {
        if (!name || !email || !password) throw new Error("Please fill in all fields");
        if (name.length < 3) throw new Error("Name must be at least 3 characters");
        if (password.length < 8) throw new Error("Password must be at least 8 characters");
        await signUp({ name, email, password });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = api.getGoogleAuthUrl();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 transition-all duration-300">
      <div className="relative w-full max-w-md bg-white border-2 border-brand-black rounded-none shadow-[8px_8px_0px_0px_rgba(24,22,22,1)] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b-2 border-brand-black">
          <span className="text-xl font-black uppercase text-brand-black tracking-tight">
            {tab === "login" ? "Sign In //" : "Join Lattice //"}
          </span>
          <button
            onClick={onClose}
            className="p-1 border-2 border-transparent hover:border-brand-black transition-colors cursor-pointer"
          >
            <X size={18} className="text-brand-black" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="p-3.5 mb-4 text-xs font-bold uppercase tracking-wider bg-brand-rose/10 border-2 border-brand-rose text-brand-rose">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "signup" && (
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3.5 text-brand-black" size={16} />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 awwwards-input rounded-none text-sm font-semibold"
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-brand-black" size={16} />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 awwwards-input rounded-none text-sm font-semibold"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-brand-black" size={16} />
              <input
                type="password"
                placeholder="Password (min. 8 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 awwwards-input rounded-none text-sm font-semibold"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="awwwards-btn-primary flex items-center justify-center gap-2 w-full py-3.5 rounded-none font-bold text-xs uppercase"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <span>{tab === "login" ? "Log In" : "Sign Up"}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t-2 border-zinc-200"></div>
            <span className="flex-shrink mx-4 text-[10px] font-black uppercase text-zinc-400">Or connect with</span>
            <div className="flex-grow border-t-2 border-zinc-200"></div>
          </div>

          {/* Social login */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="flex items-center justify-center gap-3 w-full py-3.5 bg-white border-2 border-brand-black hover:bg-zinc-50 text-brand-black text-xs font-black uppercase rounded-none shadow-[4px_4px_0px_0px_rgba(24,22,22,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            {tab === "login" ? "Log in with Google" : "Sign Up with Google"}
          </button>

          {/* Toggle Flow Footer */}
          <div className="mt-6 text-center border-t-2 border-brand-black pt-4">
            {tab === "login" ? (
              <p className="text-xs font-bold text-brand-black uppercase tracking-wide">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setTab("signup");
                    setError(null);
                  }}
                  className="text-brand-rose underline font-black hover:text-brand-hover cursor-pointer"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p className="text-xs font-bold text-brand-black uppercase tracking-wide">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setTab("login");
                    setError(null);
                  }}
                  className="text-brand-rose underline font-black hover:text-brand-hover cursor-pointer"
                >
                  Log In
                </button>
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
