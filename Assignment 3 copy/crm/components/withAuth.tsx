"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type AllowedRole = "admin" | "agent" | "any";

/**
 * withAuth HOC
 *
 * Wraps a page/component to:
 *  1. Show a loading spinner while auth state is resolving
 *  2. Redirect to /login if the user is not authenticated
 *  3. Redirect to their dashboard if their role doesn't match
 *
 * @example
 * export default withAuth(AdminDashboard, 'admin');
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole: AllowedRole = "any"
) {
  function ProtectedComponent(props: P) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (loading) return;

      if (!user) {
        router.replace("/login");
        return;
      }

      if (requiredRole !== "any" && user.role !== requiredRole) {
        const dest =
          user.role === "admin" ? "/admin/dashboard" : "/agent/dashboard";
        router.replace(dest);
      }
    }, [user, loading, router]);

    // Loading state
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }

    // Not authenticated → redirect happening in useEffect
    if (!user) return null;

    // Wrong role → redirect happening in useEffect
    if (requiredRole !== "any" && user.role !== requiredRole) return null;

    return <Component {...props} />;
  }

  ProtectedComponent.displayName = `withAuth(${Component.displayName ?? Component.name})`;
  return ProtectedComponent;
}
