"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

interface Agent {
  _id: string;
  name: string;
  email: string;
}

export function AddLeadDialog({ onLeadAdded }: { onLeadAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [budget, setBudget] = useState("");
  const [propertyInterest, setPropertyInterest] = useState("");
  const [source, setSource] = useState("other");
  const [assignedTo, setAssignedTo] = useState("unassigned");

  useEffect(() => {
    if (open) {
      fetchAgents();
    }
  }, [open]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        name,
        email,
        phone,
        budget: Number(budget),
        propertyInterest,
        source,
        assignedTo: assignedTo === "unassigned" ? null : assignedTo,
      };

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setOpen(false);
        // Reset form
        setName("");
        setEmail("");
        setPhone("");
        setBudget("");
        setPropertyInterest("");
        setSource("other");
        setAssignedTo("unassigned");
        onLeadAdded();
      } else {
        setError(data.error || "Failed to create lead");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus size={16} /> Add Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>
            Enter the details of the new lead. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">{error}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (PKR) *</Label>
              <Input id="budget" type="number" min="0" value={budget} onChange={(e) => setBudget(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="propertyInterest">Property Interest</Label>
            <Input id="propertyInterest" placeholder="e.g. 5 Marla Plot DHA Phase 8" value={propertyInterest} onChange={(e) => setPropertyInterest(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="walk-in">Walk-in</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assign To Agent</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent._id} value={agent._id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Lead"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
