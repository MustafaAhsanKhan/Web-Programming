"use client";

import { withAuth } from "@/components/withAuth";
import { useAuth } from "@/hooks/useAuth";
import { LogoutButton } from "@/components/LogoutButton";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Topbar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-card border-b border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <span className="font-bold text-lg">
            Property<span className="text-primary">CRM</span>
          </span>
          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20">
            Admin
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-muted-foreground">
            {user?.name}
          </span>
          <LogoutButton variant="ghost" />
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Welcome */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your leads today.
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Leads",
              value: "—",
              icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
              color: "bg-primary/10 text-primary",
            },
            {
              label: "High Priority",
              value: "—",
              icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
              color: "bg-destructive/10 text-destructive",
            },
            {
              label: "Agents",
              value: "—",
              icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
              color: "bg-success/10 text-success",
            },
            {
              label: "Closed This Month",
              value: "—",
              icon: "M22 11.08V12a10 10 0 1 1-5.93-9.14",
              color: "bg-accent/10 text-accent",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-card border border-border p-5 flex items-center gap-4 hover:border-primary/30 transition-colors"
            >
              <div
                className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center ${stat.color}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={stat.icon} />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">
              Lead Management is Live!
            </h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              You can now add leads, assign them to agents, and track activities.
            </p>
            <Link href="/admin/leads">
              <Button>Go to Leads Database</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default withAuth(AdminDashboard, "admin");
