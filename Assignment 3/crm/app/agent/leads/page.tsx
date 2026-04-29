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
import { ArrowLeft, Eye, Search, CalendarIcon, MessageSquare, Bell } from "lucide-react";
import { formatBudget } from "@/lib/utils";
import { isToday, isPast, format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLeadSocket } from "@/hooks/useLeadSocket";

interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  budget: number;
  status: string;
  score: number;
  notes: string;
  followUpDate?: string;
  createdAt: string;
}

function AgentLeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append("search", search);
      if (status !== "all") query.append("status", status);

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

  useLeadSocket(fetchLeads);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchLeads();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, status]);

  const handleUpdateLead = async (leadId: string, updates: any) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getScoreBadge = (score: number) => {
    if (score === 3) return <Badge className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">High</Badge>;
    if (score === 2) return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Medium</Badge>;
    return <Badge className="bg-green-500 hover:bg-green-600 text-white">Low</Badge>;
  };

  // Returns urgency class + bell indicator for a follow-up date
  const getFollowupMeta = (dateStr?: string) => {
    if (!dateStr) return { rowClass: "", isUrgent: false };
    const d = new Date(dateStr);
    if (isPast(d) && !isToday(d)) return { rowClass: "bg-destructive/5 hover:bg-destructive/10 border-l-2 border-l-destructive", isUrgent: true, label: "Overdue" };
    if (isToday(d)) return { rowClass: "bg-yellow-500/5 hover:bg-yellow-500/10 border-l-2 border-l-yellow-500", isUrgent: true, label: "Today" };
    return { rowClass: "", isUrgent: false };
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Topbar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-card border-b border-border shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/agent/dashboard" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg hidden sm:inline-block">
              My Assigned Leads
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              Agent
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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Leads Database</h1>
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
          </CardContent>
        </Card>

        {/* Table */}
        <div className="rounded-md border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      Loading leads...
                    </TableCell>
                  </TableRow>
                ) : leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No leads assigned to you.
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => {
                    const { rowClass, isUrgent, label: urgencyLabel } = getFollowupMeta(lead.followUpDate);
                    return (
                    <TableRow key={lead._id} className={rowClass}>
                      <TableCell className="font-medium whitespace-nowrap">
                        <div>{lead.name}</div>
                        <div className="text-xs text-muted-foreground">{lead.phone}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatBudget(lead.budget)}</TableCell>
                      <TableCell>{getScoreBadge(lead.score)}</TableCell>
                      <TableCell>
                        <Select
                          value={lead.status}
                          onValueChange={(val) => handleUpdateLead(lead._id, { status: val })}
                        >
                          <SelectTrigger className="w-[120px] h-8 text-xs bg-background">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="New">New</SelectItem>
                            <SelectItem value="Contacted">Contacted</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`w-[140px] justify-start text-left font-normal ${
                                !lead.followUpDate ? "text-muted-foreground" : ""
                              } ${isUrgent ? "border-destructive/50" : ""}`}
                            >
                              {isUrgent && (
                                <Bell size={13} className={`mr-1.5 flex-shrink-0 ${
                                  urgencyLabel === "Overdue" ? "text-destructive" : "text-yellow-500"
                                }`} />
                              )}
                              {!isUrgent && <CalendarIcon className="mr-2 h-4 w-4" />}
                              {lead.followUpDate
                                ? format(new Date(lead.followUpDate), "dd MMM yy")
                                : "Set date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={lead.followUpDate ? new Date(lead.followUpDate) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  // Use the dedicated followup endpoint
                                  fetch(`/api/leads/${lead._id}/followup`, {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ followUpDate: date.toISOString() }),
                                  }).then(() => fetchLeads());
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background/50">
                                <MessageSquare size={16} />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Edit Notes</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                handleUpdateLead(lead._id, { notes: formData.get("notes") });
                              }}>
                                <div className="grid gap-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="notes" className="text-left">
                                      Notes for {lead.name}
                                    </Label>
                                    <textarea
                                      id="notes"
                                      name="notes"
                                      defaultValue={lead.notes}
                                      className="w-full min-h-[100px] flex rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                      placeholder="Add notes about this lead..."
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button type="submit">Save Notes</Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <Link href={`/leads/${lead._id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background/50">
                              <Eye size={16} />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default withAuth(AgentLeadsPage, "agent");
