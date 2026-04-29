"use client";

import { useState, useEffect, useCallback } from "react";
import { withAuth } from "@/components/withAuth";
import { useAuth } from "@/hooks/useAuth";
import { LogoutButton } from "@/components/LogoutButton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLeadSocket } from "@/hooks/useLeadSocket";
import { Users, Zap, Bell, CheckCircle, Clock } from "lucide-react";
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

// Data Interfaces
interface AgentPerformance {
  agentName: string;
  totalAssigned: number;
  closedCount: number;
  inProgressCount: number;
}

interface LeadByDate {
  date: string;
  displayDate: string;
  count: number;
}

interface RecentLead {
  _id: string;
  name: string;
  status: string;
  score: number;
  createdAt: string;
  assignedTo?: { name: string };
}

interface DashboardData {
  totalLeads: number;
  highPriority: number;
  overdueFollowupsCount: number;
  closedThisMonth: number;
  leadsByStatus: { New: number; Contacted: number; "In Progress": number; Closed: number };
  leadsByPriority: { High: number; Medium: number; Low: number };
  agentPerformance: AgentPerformance[];
  leadsByDate: LeadByDate[];
  recentLeads: RecentLead[];
}

// Colors for charts
const STATUS_COLORS = {
  New: "#3b82f6", // blue
  Contacted: "#f59e0b", // yellow
  "In Progress": "#8b5cf6", // purple
  Closed: "#22c55e", // green
};

const PRIORITY_COLORS = {
  High: "#ef4444", // red
  Medium: "#f59e0b", // yellow
  Low: "#22c55e", // green
};

function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics/dashboard");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch admin analytics", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useLeadSocket(fetchDashboardData);

  const statCards = [
    {
      label: "Total Leads",
      value: loading ? "—" : data?.totalLeads ?? 0,
      icon: <Users size={22} />,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      label: "High Priority",
      value: loading ? "—" : data?.highPriority ?? 0,
      icon: <Zap size={22} />,
      color: "bg-destructive/10 text-destructive",
    },
    {
      label: "Overdue Follow-ups",
      value: loading ? "—" : data?.overdueFollowupsCount ?? 0,
      icon: <Bell size={22} />,
      color: (data?.overdueFollowupsCount ?? 0) > 0 ? "bg-red-500/10 text-red-500" : "bg-muted/10 text-muted-foreground",
    },
    {
      label: "Closed This Month",
      value: loading ? "—" : data?.closedThisMonth ?? 0,
      icon: <CheckCircle size={22} />,
      color: "bg-green-500/10 text-green-500",
    },
  ];

  // Prepare chart data
  const statusChartData = data ? [
    { name: "New", value: data.leadsByStatus.New },
    { name: "Contacted", value: data.leadsByStatus.Contacted },
    { name: "In Progress", value: data.leadsByStatus["In Progress"] },
    { name: "Closed", value: data.leadsByStatus.Closed },
  ] : [];

  const priorityChartData = data ? [
    { name: "High", count: data.leadsByPriority.High, fill: PRIORITY_COLORS.High },
    { name: "Medium", count: data.leadsByPriority.Medium, fill: PRIORITY_COLORS.Medium },
    { name: "Low", count: data.leadsByPriority.Low, fill: PRIORITY_COLORS.Low },
  ] : [];

  const getScoreBadge = (score: number) => {
    if (score === 3) return <Badge className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-1 py-0 text-[10px]">High</Badge>;
    if (score === 2) return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white px-1 py-0 text-[10px]">Medium</Badge>;
    return <Badge className="bg-green-500 hover:bg-green-600 text-white px-1 py-0 text-[10px]">Low</Badge>;
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
          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/leads">
            <Button variant="outline" size="sm">Manage Leads</Button>
          </Link>
          <span className="hidden sm:block text-sm text-muted-foreground">{user?.name}</span>
          <LogoutButton variant="ghost" />
        </div>
      </header>

      <main className="p-4 sm:p-6 max-w-[1400px] mx-auto space-y-6">
        {/* Welcome */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">Real-time overview of your business performance.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-card border border-border p-5 flex items-center gap-4 hover:border-primary/30 transition-colors">
              <div className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground whitespace-nowrap">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Main Charts Area */}
          <div className="xl:col-span-2 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Lead Status Donut Chart */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-lg mb-4">Lead Status Distribution</h3>
                <div className="h-[250px] w-full">
                  {!loading && data ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">Loading...</div>
                  )}
                </div>
              </div>

              {/* Priority Bar Chart */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-lg mb-4">Leads by Priority</h3>
                <div className="h-[250px] w-full">
                  {!loading && data ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={priorityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <RechartsTooltip 
                          cursor={{ fill: "hsl(var(--muted))" }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">Loading...</div>
                  )}
                </div>
              </div>
            </div>

            {/* Leads Over Time Line Chart */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Leads Created (Last 7 Days)</h3>
              <div className="h-[250px] w-full">
                {!loading && data ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.leadsByDate} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="displayDate" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: "#6366f1", strokeWidth: 2, stroke: "hsl(var(--background))" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">Loading...</div>
                )}
              </div>
            </div>

            {/* Agent Performance Chart (Horizontal Bar) */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Agent Performance</h3>
              <div className="h-[300px] w-full">
                {!loading && data ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={data.agentPerformance} 
                      layout="vertical" 
                      margin={{ top: 0, right: 10, left: 20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false}/>
                      <YAxis type="category" dataKey="agentName" tick={{ fill: "hsl(var(--foreground))", fontSize: 13 }} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        cursor={{ fill: "hsl(var(--muted))" }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="top" height={36}/>
                      <Bar dataKey="closedCount" name="Closed" stackId="a" fill={STATUS_COLORS.Closed} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="inProgressCount" name="In Progress" stackId="a" fill={STATUS_COLORS["In Progress"]} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">Loading...</div>
                )}
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Leads Feed */}
            <div className="bg-card border border-border rounded-xl p-0 shadow-sm overflow-hidden flex flex-col h-full max-h-[600px]">
              <div className="p-5 border-b border-border flex items-center gap-2">
                <Clock size={18} className="text-muted-foreground" />
                <h3 className="font-semibold text-lg">Recent Leads</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {!loading && data ? (
                  data.recentLeads.length > 0 ? (
                    <div className="divide-y divide-border/50">
                      {data.recentLeads.map((lead) => (
                        <div key={lead._id} className="p-3 hover:bg-muted/50 transition-colors rounded-lg flex flex-col gap-1.5">
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-sm">{lead.name}</span>
                            {getScoreBadge(lead.score)}
                          </div>
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>{lead.assignedTo ? `Assigned to: ${lead.assignedTo.name}` : "Unassigned"}</span>
                            <span>{formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}</span>
                          </div>
                          <div>
                            <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                              lead.status === 'New' ? 'bg-blue-500' :
                              lead.status === 'Contacted' ? 'bg-yellow-500' :
                              lead.status === 'In Progress' ? 'bg-purple-500' : 'bg-green-500'
                            }`}></span>
                            <span className="text-xs text-foreground/80">{lead.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-5 text-center text-muted-foreground text-sm">No recent leads found.</div>
                  )
                ) : (
                  <div className="p-5 text-center text-muted-foreground text-sm">Loading...</div>
                )}
              </div>
              <div className="p-4 border-t border-border bg-muted/20">
                <Link href="/admin/leads" className="w-full">
                  <Button variant="outline" className="w-full text-xs h-8">View All Leads</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default withAuth(AdminDashboard, "admin");
