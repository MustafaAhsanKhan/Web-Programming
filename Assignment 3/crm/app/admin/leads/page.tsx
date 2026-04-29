"use client";

import { useState, useEffect } from "react";
import { withAuth } from "@/components/withAuth";
import { useAuth } from "@/hooks/useAuth";
import { LogoutButton } from "@/components/LogoutButton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddLeadDialog } from "@/components/AddLeadDialog";
import { ArrowLeft, Trash2, Eye, Search } from "lucide-react";
import { formatBudget } from "@/lib/utils";
import { toast } from "sonner";
import { useLeadSocket } from "@/hooks/useLeadSocket";

interface Agent {
  _id: string;
  name: string;
}

interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  budget: number;
  status: string;
  score: number;
  assignedTo?: Agent | null;
  createdAt: string;
}

function AdminLeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [score, setScore] = useState("all");

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append("search", search);
      if (status !== "all") query.append("status", status);
      if (score !== "all") query.append("score", score);

      const res = await fetch(`/api/leads?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads);
      }
    } catch (err) {
      console.error("Failed to fetch leads", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  useLeadSocket(fetchLeads);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchLeads();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, status, score]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async (leadId: string, agentId: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agentId === "unassigned" ? null : agentId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchLeads();
        toast.success(agentId === "unassigned" ? "Lead unassigned" : "Lead assigned successfully");
      } else {
        toast.error("Failed to update lead assignment");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during assignment");
    }
  };

  const getScoreBadge = (score: number) => {
    if (score === 3) return <Badge className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">High</Badge>;
    if (score === 2) return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Medium</Badge>;
    return <Badge className="bg-green-500 hover:bg-green-600 text-white">Low</Badge>;
  };

  const getRowColor = (score: number) => {
    if (score === 3) return "bg-destructive/5 hover:bg-destructive/10";
    if (score === 2) return "bg-yellow-500/5 hover:bg-yellow-500/10";
    return "bg-green-500/5 hover:bg-green-500/10";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Topbar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-card border-b border-border shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg hidden sm:inline-block">
              Lead Management
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20">
              Admin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-muted-foreground">
            {user?.name}
          </span>
          <LogoutButton variant="ghost" />
        </div>
      </header>

      <main className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Leads Database</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open('/api/leads/export?format=excel', '_blank')}>
              Export Excel
            </Button>
            <Button variant="outline" onClick={() => window.open('/api/leads/export?format=pdf', '_blank')}>
              Export PDF
            </Button>
            <AddLeadDialog onLeadAdded={fetchLeads} />
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Contacted">Contacted</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={score} onValueChange={setScore}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="3">High Priority</SelectItem>
                <SelectItem value="2">Medium Priority</SelectItem>
                <SelectItem value="1">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Table */}
        <div className="rounded-md border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      Loading leads...
                    </TableCell>
                  </TableRow>
                ) : leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No leads found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow key={lead._id} className={getRowColor(lead.score)}>
                      <TableCell className="font-medium whitespace-nowrap">{lead.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">{lead.email}</div>
                        <div className="text-xs text-muted-foreground">{lead.phone}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatBudget(lead.budget)}</TableCell>
                      <TableCell>{getScoreBadge(lead.score)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{lead.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={lead.assignedTo?._id || "unassigned"}
                          onValueChange={(val) => handleAssign(lead._id, val)}
                        >
                          <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
                            <SelectValue placeholder="Assign" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {agents.map((a) => (
                              <SelectItem key={a._id} value={a._id}>{a.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/leads/${lead._id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background/50">
                              <Eye size={16} />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDelete(lead._id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default withAuth(AdminLeadsPage, "admin");
