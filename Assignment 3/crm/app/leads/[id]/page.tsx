"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { withAuth } from "@/components/withAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBudget, getWhatsAppUrl, timeAgo } from "@/lib/utils";
import { ILeadClient, IActivityClient } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, MessageCircle, ArrowLeft, Edit2, CheckCircle2, XCircle } from "lucide-react";
import { Label } from "@/components/ui/label";

function LeadDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const [lead, setLead] = useState<ILeadClient | null>(null);
  const [activities, setActivities] = useState<IActivityClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editFollowUpDate, setEditFollowUpDate] = useState<Date | undefined>(undefined);

  const fetchLeadInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${id}`);
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Failed to load lead");
        setLoading(false);
        return;
      }

      setLead(data.lead);
      setActivities(data.activities || []);
      
      setEditStatus(data.lead.status);
      setEditNotes(data.lead.notes || "");
      setEditFollowUpDate(data.lead.followUpDate ? new Date(data.lead.followUpDate) : undefined);
      
    } catch (err) {
      console.error(err);
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchLeadInfo();
  }, [id]);

  const handleUpdate = async () => {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          notes: editNotes,
          followUpDate: editFollowUpDate ? editFollowUpDate.toISOString() : null
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setIsEditing(false);
        fetchLeadInfo(); // Refresh to get new activities
      } else {
        alert(data.error || "Update failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground min-h-screen">Loading lead details...</div>;
  if (error) return <div className="p-8 text-center text-destructive min-h-screen">{error}</div>;
  if (!lead) return <div className="p-8 text-center min-h-screen">Lead not found</div>;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Lead Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">{lead.name}</h1>
              <p className="text-muted-foreground">{lead.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge variant="outline" className="bg-background">{lead.status}</Badge>
                {lead.score === 3 && <Badge className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">High Priority</Badge>}
                {lead.score === 2 && <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Medium Priority</Badge>}
                {lead.score === 1 && <Badge className="bg-green-500 hover:bg-green-600 text-white">Low Priority</Badge>}
              </div>
            </div>
            
            <a href={getWhatsAppUrl(lead.phone)} target="_blank" rel="noopener noreferrer">
              <Button className="bg-[#25D366] hover:bg-[#20bd5a] text-white">
                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
              </Button>
            </a>
          </div>

          <div className="bg-card border rounded-xl p-6 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">Phone</p>
              <p className="font-medium">{lead.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">Budget</p>
              <p className="font-semibold">{formatBudget(lead.budget)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">Property Interest</p>
              <p className="font-medium">{lead.propertyInterest || "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">Source</p>
              <p className="capitalize font-medium">{lead.source}</p>
            </div>
          </div>

          {/* Edit Section */}
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold tracking-tight">Manage Lead</h2>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="mr-2 h-4 w-4" /> Edit
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={editStatus} onValueChange={setEditStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Contacted">Contacted</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Follow-up Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${!editFollowUpDate && "text-muted-foreground"}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editFollowUpDate ? format(editFollowUpDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={editFollowUpDate}
                          onSelect={setEditFollowUpDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <textarea 
                    className="w-full min-h-[120px] flex rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={editNotes} 
                    onChange={e => setEditNotes(e.target.value)}
                    placeholder="Add details about your interaction..."
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleUpdate}>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Save Changes
                  </Button>
                  <Button variant="ghost" onClick={() => setIsEditing(false)}>
                    <XCircle className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Next Follow-up</p>
                  <div className="flex items-center text-sm font-medium">
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {lead.followUpDate ? format(new Date(lead.followUpDate), "PPP") : "No follow-up set"}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-2">Notes</p>
                  <div className="bg-muted/50 p-4 rounded-lg min-h-[80px] text-sm whitespace-pre-wrap border border-border/50">
                    {lead.notes || <span className="text-muted-foreground italic">No notes added yet.</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Activity Timeline */}
        <div className="bg-card border rounded-xl p-6 shadow-sm h-fit max-h-[80vh] overflow-y-auto">
          <h2 className="text-lg font-bold mb-6 sticky top-0 bg-card py-2 border-b">Activity Timeline</h2>
          
          {activities.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No activities yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {activities.map((activity, index) => (
                <div key={activity._id} className="relative flex gap-4">
                  {/* Timeline Line */}
                  {index !== activities.length - 1 && (
                    <div className="absolute left-[5px] top-6 bottom-[-24px] w-px bg-border" />
                  )}
                  
                  {/* Dot */}
                  <div className="relative mt-1.5 h-3 w-3 rounded-full bg-primary flex-shrink-0 ring-4 ring-card" />
                  
                  {/* Content */}
                  <div className="pb-2">
                    <p className="text-sm font-medium text-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      by {(activity.performedBy as any)?.name || 'System'} • {timeAgo(activity.createdAt)}
                    </p>
                    {activity.details && (
                      <p className="text-xs mt-2 text-muted-foreground bg-muted p-2.5 rounded-md border border-border/50">
                        {activity.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default withAuth(LeadDetailPage, "any");
