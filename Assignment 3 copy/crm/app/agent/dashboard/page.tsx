"use client";

import { withAuth } from "@/components/withAuth";
import { useAuth } from "@/hooks/useAuth";
import { LogoutButton } from "@/components/LogoutButton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLeadSocket } from "@/hooks/useLeadSocket";

function AgentDashboard() {
  const { user } = useAuth();
  useLeadSocket();

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
          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
            Agent
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
      <main className="p-6 max-w-5xl mx-auto space-y-8">
        {/* Welcome */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Hey, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground">
            Here are your assigned leads for today.
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "My Leads",
              value: "—",
              color: "bg-primary/10 text-primary",
            },
            {
              label: "Follow-ups Today",
              value: "—",
              color: "bg-warning/10 text-warning",
            },
            {
              label: "Closed This Month",
              value: "—",
              color: "bg-success/10 text-success",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-card border border-border p-5 hover:border-primary/30 transition-colors"
            >
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              <div
                className={`mt-3 h-1 w-16 rounded-full ${stat.color.split(" ")[0]}`}
              />
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
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">
              Your Lead List is Ready!
            </h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              View your assigned leads, update their statuses, and set follow-ups.
            </p>
            <Link href="/agent/leads">
              <Button>View My Leads</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default withAuth(AgentDashboard, "agent");
