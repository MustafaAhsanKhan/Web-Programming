"use client";

import { useState, useEffect, useCallback } from "react";
import { withAuth } from "@/components/withAuth";
import { useAuth } from "@/hooks/useAuth";
import { LogoutButton } from "@/components/LogoutButton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLeadSocket } from "@/hooks/useLeadSocket";
import { Users, Zap, UserCheck, CheckCircle, AlertTriangle } from "lucide-react";

interface AdminStats {
  totalLeads: number;
  highPriority: number;
  totalAgents: number;
  closedThisMonth: number;
  staleCount: number;
}

function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalLeads: 0,
    highPriority: 0,
    totalAgents: 0,
    closedThisMonth: 0,
    staleCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const [leadsRes, agentsRes, staleRes] = await Promise.all([
        fetch("/api/leads"),
        fetch("/api/users"),
        fetch("/api/leads/followups/stale"),
      ]);

      const [leadsData, agentsData, staleData] = await Promise.all([
        leadsRes.json(),
        agentsRes.json(),
        staleRes.json(),
      ]);

      const leads: any[] = leadsData.success ? leadsData.leads : [];
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      setStats({
        totalLeads: leads.length,
        highPriority: leads.filter((l) => l.score === 3).length,
        totalAgents: agentsData.success ? agentsData.agents.length : 0,
        closedThisMonth: leads.filter(
          (l) => l.status === "Closed" && new Date(l.updatedAt) >= startOfMonth
        ).length,
        staleCount: staleData.success ? staleData.count : 0,
      });
    } catch (err) {
      console.error("Failed to fetch admin stats", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useLeadSocket(fetchStats);

  const statCards = [
    {
      label: "Total Leads",
      value: loading ? "—" : stats.totalLeads,
      icon: <Users size={22} />,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "High Priority",
      value: loading ? "—" : stats.highPriority,
      icon: <Zap size={22} />,
      color: "bg-destructive/10 text-destructive",
    },
    {
      label: "Agents",
      value: loading ? "—" : stats.totalAgents,
      icon: <UserCheck size={22} />,
      color: "bg-green-500/10 text-green-500",
    },
    {
      label: "Closed This Month",
      value: loading ? "—" : stats.closedThisMonth,
      icon: <CheckCircle size={22} />,
      color: "bg-accent/10 text-accent",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Topbar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-card border-b border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="text-primary">
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
          <span className="hidden sm:block text-sm text-muted-foreground">{user?.name}</span>
          <LogoutButton variant="ghost" />
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Welcome */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your leads today.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-card border border-border p-5 flex items-center gap-4 hover:border-primary/30 transition-colors">
              <div className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stale leads alert */}
        {!loading && stats.staleCount > 0 && (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5 flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-yellow-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-600 dark:text-yellow-400">
                {stats.staleCount} Stale Lead{stats.staleCount > 1 ? "s" : ""} Need Attention
              </h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                These leads have had no activity in the last 7 days and are at risk of going cold.
              </p>
              <Link href="/admin/leads?filter=stale">
                <Button variant="outline" size="sm" className="border-yellow-500/40 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10">
                  Review Stale Leads
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="text-primary">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Lead Management is Live!</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Add leads, assign them to agents, and track all activities in one place.
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
