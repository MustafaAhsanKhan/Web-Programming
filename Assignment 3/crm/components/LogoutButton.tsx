"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface LogoutButtonProps {
  className?: string;
  variant?: "default" | "ghost" | "destructive";
}

export function LogoutButton({
  className = "",
  variant = "default",
}: LogoutButtonProps) {
  const { logout } = useAuth();
  const [pending, setPending] = useState(false);

  const handleLogout = async () => {
    setPending(true);
    await logout();
    // logout() redirects to /login so no need to reset
  };

  const baseStyles =
    "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all cursor-pointer disabled:opacity-50";

  const variantStyles = {
    default:
      "bg-secondary text-secondary-foreground border border-border hover:bg-muted",
    ghost: "hover:bg-muted text-foreground",
    destructive:
      "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20",
  };

  return (
    <button
      onClick={handleLogout}
      disabled={pending}
      id="logout-btn"
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {pending ? (
        <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      )}
      {pending ? "Signing out..." : "Sign Out"}
    </button>
  );
}
