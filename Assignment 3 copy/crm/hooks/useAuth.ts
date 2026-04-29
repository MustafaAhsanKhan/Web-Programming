"use client";

import { useAuthContext } from "@/context/AuthContext";

/**
 * useAuth — thin re-export of the AuthContext hook.
 * Use this in any client component:
 *
 * @example
 * const { user, login, logout, loading } = useAuth();
 */
export function useAuth() {
  return useAuthContext();
}
