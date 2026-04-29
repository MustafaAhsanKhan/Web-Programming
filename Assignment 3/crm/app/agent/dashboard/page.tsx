"use client";

import { useState, useEffect, useCallback } from "react";
import { withAuth } from "@/components/withAuth";
import { useAuth } from "@/hooks/useAuth";
import { LogoutButton } from "@/components/LogoutButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useLeadSocket } from "@/hooks/useLeadSocket";
import { Bell, AlertTriangle, Clock, Users, CheckCircle, TrendingUp } from "lucide-react";
import { formatDistanceToNow, format, isToday, isPast } from "date-fns";

interface Lead {
  _id: string;
  name: string;
  phone: string;
  followUpDate?: string;
  lastActivity?: string;
  status: string;
  score: number;
}

interface DashboardStats {
  totalLeads: number;
  overdueFollowups: Lead[];
  staleLeads: Lead[];
  closedThisMonth: number;
}

function AgentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    overdueFollowups: [],
    staleLeads: [],
    closedThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const [leadsRes, overdueRes, staleRes] = await Promise.all([
        fetch("/api/leads"),
        fetch("/api/leads/followups/overdue"),
        fetch("/api/leads/followups/stale"),
      ]);

      const [leadsData, overdueData, staleData] = await Promise.all([
        leadsRes.json(),
        overdueRes.json(),
        staleRes.json(),
      ]);

      const allLeads: Lead[] = leadsData.success ? leadsData.leads : [];
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      setStats({
        totalLeads: allLeads.length,
        overdueFollowups: overdueData.success ? overdueData.leads : [],
        staleLeads: staleData.success ? staleData.leads : [],
        closedThisMonth: allLeads.filter(
          (l: any) =>
            l.status === "Closed" && new Date(l.updatedAt) >= startOfMonth
        ).length,
      });
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useLeadSocket(fetchStats);

  const scoreLabel = (score: number) => {
    if (score === 3) return <Badge className="bg-destructive/80 text-white text-xs">High</Badge>;
    if (score === 2) return <Badge className="bg-yellow-500/80 text-white text-xs">Med</Badge>;
    return <Badge className="bg-green-500/80 text-white text-xs">Low</Badge>;
  };

  const followupUrgency = (dateStr?: string) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isPast(d) && !isToday(d)) return "overdue";
    if (isToday(d)) return "today";
    return "upcoming";
  };

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
          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
            Agent
          </span>
        </div>
        <div className="flex items-center gap-3">
          {stats.overdueFollowups.length > 0 && (
            <span className="relative">
              <Bell size={18} className="text-destructive" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center font-bold">
                {stats.overdueFollowups.length}
              </span>
            </span>
          )}
          <span className="hidden sm:block text-sm text-muted-foreground">{user?.name}</span>
          <LogoutButton variant="ghost" />
        </div>
      </header>

      <main className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8">
        {/* Welcome */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Hey, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground">Here are your assigned leads for today.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "My Leads", value: loading ? "—" : stats.totalLeads, icon: <Users size={20} />, color: "bg-primary/10 text-primary" },
            {
              label: "Overdue Follow-ups",
              value: loading ? "—" : stats.overdueFollowups.length,
              icon: <Bell size={20} />,
              color: stats.overdueFollowups.length > 0 ? "bg-destructive/10 text-destructive" : "bg-muted/10 text-muted-foreground",
            },
            {
              label: "Stale Leads (7d)",
              value: loading ? "—" : stats.staleLeads.length,
              icon: <AlertTriangle size={20} />,
              color: stats.staleLeads.length > 0 ? "bg-yellow-500/10 text-yellow-500" : "bg-muted/10 text-muted-foreground",
            },
            { label: "Closed This Month", value: loading ? "—" : stats.closedThisMonth, icon: <CheckCircle size={20} />, color: "bg-green-500/10 text-green-500" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-card border border-border p-5 hover:border-primary/30 transition-colors">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Overdue Follow-ups Panel */}
        {stats.overdueFollowups.length > 0 && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-destructive/20">
              <Bell size={16} className="text-destructive" />
              <h2 className="font-semibold text-destructive">
                Overdue Follow-ups ({stats.overdueFollowups.length})
              </h2>
            </div>
            <div className="divide-y divide-destructive/10">
              {stats.overdueFollowups.slice(0, 5).map((lead) => {
                const urgency = followupUrgency(lead.followUpDate);
                return (
                  <Link key={lead._id} href={`/leads/${lead._id}`} className="flex items-center justify-between px-5 py-3 hover:bg-destructive/10 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${urgency === "overdue" ? "bg-destructive" : "bg-yellow-500"}`} />
                      <div>
                        <p className="font-medium text-sm">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {scoreLabel(lead.score)}
                      <p className="text-xs text-destructive mt-1">
                        Due {lead.followUpDate ? format(new Date(lead.followUpDate), "dd MMM") : "—"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
            {stats.overdueFollowups.length > 5 && (
              <div className="px-5 py-3 text-xs text-muted-foreground text-center">
                +{stats.overdueFollowups.length - 5} more overdue
              </div>
            )}
          </div>
        )}

        {/* Stale Leads Panel */}
        {stats.staleLeads.length > 0 && (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-yellow-500/20">
              <AlertTriangle size={16} className="text-yellow-500" />
              <h2 className="font-semibold text-yellow-600 dark:text-yellow-400">
                Stale Leads — No Activity in 7+ Days ({stats.staleLeads.length})
              </h2>
            </div>
            <div className="divide-y divide-yellow-500/10">
              {stats.staleLeads.slice(0, 5).map((lead) => (
                <Link key={lead._id} href={`/leads/${lead._id}`} className="flex items-center justify-between px-5 py-3 hover:bg-yellow-500/10 transition-colors">
                  <div>
                    <p className="font-medium text-sm">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Last activity:{" "}
                      {lead.lastActivity
                        ? formatDistanceToNow(new Date(lead.lastActivity), { addSuffix: true })
                        : "never"}
                    </p>
                  </div>
                  <div className="text-right">
                    {scoreLabel(lead.score)}
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 capitalize">{lead.status}</p>
                  </div>
                </Link>
              ))}
            </div>
            {stats.staleLeads.length > 5 && (
              <div className="px-5 py-3 text-xs text-muted-foreground text-center">
                +{stats.staleLeads.length - 5} more stale leads
              </div>
            )}
          </div>
        )}

        {/* Quick Links */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={20} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Your Lead List is Ready!</h3>
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
