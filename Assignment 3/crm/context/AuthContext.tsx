"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────
export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "agent";
  createdAt?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (
    name: string,
    email: string,
    password: string,
    role: "admin" | "agent"
  ) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true); // true until first /me check
  const router = useRouter();

  // Fetch current user on mount (checks HttpOnly cookie via /api/auth/me)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        // Not authenticated — leave user as null
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Login ───────────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: data.error || "Login failed" };
      }

      setUser(data.user);

      // Role-based redirect
      const dest =
        data.user.role === "admin" ? "/admin/dashboard" : "/agent/dashboard";
      router.push(dest);
      return {};
    },
    [router]
  );

  // ── Signup ──────────────────────────────────────────────
  const signup = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      role: "admin" | "agent"
    ): Promise<{ error?: string }> => {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: data.error || "Signup failed" };
      }

      setUser(data.user);

      const dest =
        data.user.role === "admin" ? "/admin/dashboard" : "/agent/dashboard";
      router.push(dest);
      return {};
    },
    [router]
  );

  // ── Logout ──────────────────────────────────────────────
  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Internal hook (used by useAuth) ────────────────────
export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within <AuthProvider>");
  }
  return ctx;
}
