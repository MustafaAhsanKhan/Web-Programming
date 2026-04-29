import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Activity from "@/models/Activity";
import User from "@/models/User";
import { updateLeadAdminSchema, updateLeadAgentSchema } from "@/lib/validations/lead";
import { broadcastSseEvent } from "@/lib/sse";
import { withMiddleware } from "@/lib/api-middleware";

export const GET = withMiddleware(
  async (request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    await dbConnect();

    const lead = await Lead.findById(id).populate("assignedTo", "name email");

    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    // Agent can only view if assigned to them
    if (request.user.role === "agent" && lead.assignedTo?._id.toString() !== request.user.userId) {
      return NextResponse.json({ success: false, error: "Forbidden: Not assigned to this lead" }, { status: 403 });
    }

    // Fetch activities for this lead
    const activities = await Activity.find({ lead: id })
      .populate("performedBy", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      lead,
      activities
    });
  },
  { requireAuth: true }
);

export const PUT = withMiddleware(
  async (request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    await dbConnect();

    const lead = await Lead.findById(id);

    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    // Agent check
    if (request.user.role === "agent" && lead.assignedTo?.toString() !== request.user.userId) {
      return NextResponse.json({ success: false, error: "Forbidden: Not assigned to this lead" }, { status: 403 });
    }

    const body = await request.clone().json();
    
    // Choose validation schema based on role
    const schema = request.user.role === "admin" ? updateLeadAdminSchema : updateLeadAgentSchema;
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: "Validation failed", 
        details: result.error.issues 
      }, { status: 400 });
    }

    const updates = result.data;

    // Track changes for activity log
    const activitiesToLog = [];

    if (updates.status && updates.status !== lead.status) {
      activitiesToLog.push({
        lead: id,
        action: `Status changed from ${lead.status} to ${updates.status}`,
        performedBy: request.user.userId
      });
    }

    if (request.user.role === "admin" && "assignedTo" in updates && updates.assignedTo !== undefined) {
      const oldAssignedTo = lead.assignedTo?.toString() || null;
      const newAssignedTo = updates.assignedTo || null;
      
      if (oldAssignedTo !== newAssignedTo) {
        let assignedAgentName = "Unassigned";
        if (newAssignedTo) {
          const agent = await User.findById(newAssignedTo).select("name");
          if (agent) assignedAgentName = agent.name;
        }
        
        activitiesToLog.push({
          lead: id,
          action: `Assigned to ${assignedAgentName}`,
          performedBy: request.user.userId
        });
      }
    }

    Object.assign(lead, updates);
    await lead.save();

    if (activitiesToLog.length > 0) {
      await Activity.insertMany(activitiesToLog);
    }

    broadcastSseEvent("lead_updated", { leadId: id, updates });

    return NextResponse.json({
      success: true,
      message: "Lead updated successfully",
      lead
    });
  },
  { requireAuth: true }
);

export const DELETE = withMiddleware(
  async (request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    await dbConnect();

    const lead = await Lead.findByIdAndDelete(id);

    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    await Activity.deleteMany({ lead: id });

    return NextResponse.json({
      success: true,
      message: "Lead deleted successfully"
    });
  },
  { requireAdmin: true }
);
