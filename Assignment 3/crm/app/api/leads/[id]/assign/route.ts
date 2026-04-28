import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Activity from "@/models/Activity";
import User from "@/models/User";
import { verifyToken } from "@/lib/jwt";
import { sendLeadAssignmentEmail } from "@/lib/email";
import { broadcastSseEvent } from "@/lib/sse";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("crm_token")?.value;
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    
    const user = await verifyToken(token);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden: Admins only" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const agentId = body.assignedTo;

    await dbConnect();

    const lead = await Lead.findById(id);
    if (!lead) return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });

    const oldAssignedTo = lead.assignedTo?.toString() || null;
    const newAssignedTo = agentId || null;

    if (oldAssignedTo !== newAssignedTo) {
      lead.assignedTo = newAssignedTo;
      await lead.save();

      let assignedAgentName = "Unassigned";
      if (newAssignedTo) {
        const agent = await User.findById(newAssignedTo);
        if (agent) {
          assignedAgentName = agent.name;
          await sendLeadAssignmentEmail(agent.email, lead.name, lead._id.toString());
        }
      }
      
      await Activity.create({
        lead: id,
        action: `Assigned to ${assignedAgentName}`,
        performedBy: user.userId
      });

      // Notify all connected browsers in real-time
      broadcastSseEvent("lead_assigned", { leadId: id, assignedTo: newAssignedTo });
    }

    return NextResponse.json({ success: true, lead });

  } catch (error: any) {
    console.error("[PUT /api/leads/[id]/assign]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
