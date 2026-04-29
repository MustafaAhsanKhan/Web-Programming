import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Activity from "@/models/Activity";
import User from "@/models/User";
import { broadcastSseEvent } from "@/lib/sse";
import { sendLeadAssignmentEmail } from "@/lib/email";
import { withMiddleware } from "@/lib/api-middleware";
import { leadAssignSchema } from "@/lib/schemas";
import mongoose from "mongoose";

export const PUT = withMiddleware(
  async (request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const body = await request.clone().json();
    const { agentId } = body;

    await dbConnect();

    const lead = await Lead.findById(id);
    if (!lead) return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });

    // Unassign if no agentId provided
    if (!agentId) {
      lead.assignedTo = null as any;
      await lead.save();
      await Activity.create({
        lead: id,
        action: "Lead unassigned",
        performedBy: request.user.userId,
      });
      broadcastSseEvent("lead_updated", { leadId: id, updates: { assignedTo: null } });
      return NextResponse.json({ success: true, lead });
    }

    const agent = await User.findOne({ _id: agentId, role: "agent" });
    if (!agent) return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });

    lead.assignedTo = new mongoose.Types.ObjectId(agentId) as any;
    await lead.save();

    await Activity.create({
      lead: id,
      action: `Assigned to agent ${agent.name}`,
      performedBy: request.user.userId,
    });

    broadcastSseEvent("lead_assigned", { leadId: id, agentId });

    if (agent.email) {
      sendLeadAssignmentEmail(
        agent.email,
        agent.name,
        {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          budget: lead.budget,
          propertyInterest: lead.propertyInterest,
          score: lead.score,
        },
        id
      );
    }

    return NextResponse.json({ success: true, lead });
  },
  { requireAdmin: true, schema: leadAssignSchema }
);
